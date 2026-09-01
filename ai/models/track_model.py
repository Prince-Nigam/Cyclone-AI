"""
Track Prediction Model
======================
Predicts future cyclone positions (lat/lon) using Encoder-Decoder LSTM.

Architecture: Sequence-to-Sequence LSTM
  - Encoder: LSTM processes historical track observations
  - Decoder: LSTM generates future position sequence
  - Output: Predicted [lat, lon] for next N time steps

Input:
  - Historical sequence of [lat, lon, wind_kt, pressure_hpa] (last 8 steps = 24h)

Output:
  - Predicted [lat, lon] for next 8 steps (24h ahead)

Evaluation metric: Mean Haversine Distance Error (km)

IMPORTANT: Track prediction is a MODEL ESTIMATE.
Do not use for navigation, emergency decisions, or official forecasting.
Data type of predictions: PREDICTED
"""

import logging
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)

MODEL_VERSION = "track-v1"
INPUT_FEATURES = 4        # lat, lon, wind_kt, pressure_hpa
OUTPUT_FEATURES = 2       # lat, lon
ENCODER_STEPS = 8         # 8 past steps = 24h at 3h intervals
DECODER_STEPS = 8         # 8 future steps = 24h ahead


class TrackEncoder(nn.Module):
    """LSTM Encoder: processes historical track sequence → context vector."""

    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, dropout: float):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Args:
            x: (B, T_enc, input_dim)
        Returns:
            outputs: (B, T_enc, hidden_dim)
            (h_n, c_n): Final hidden and cell states — used to init decoder
        """
        outputs, (h_n, c_n) = self.lstm(x)
        return outputs, (h_n, c_n)


class TrackDecoder(nn.Module):
    """LSTM Decoder: generates future position sequence."""

    def __init__(
        self,
        input_dim: int,    # output_features (lat, lon) — decoder input
        hidden_dim: int,
        num_layers: int,
        output_dim: int,   # output_features (lat, lon)
        dropout: float,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=False,   # time-step-by-step decoding
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward_step(
        self,
        x: torch.Tensor,
        hidden: Tuple[torch.Tensor, torch.Tensor],
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """
        Single decoder step.

        Args:
            x: (1, B, input_dim) — current input (one time step)
            hidden: (h_n, c_n) — current hidden state

        Returns:
            pred: (B, output_dim)
            new_hidden: updated (h_n, c_n)
        """
        out, new_hidden = self.lstm(x, hidden)
        pred = self.fc(out.squeeze(0))  # (B, output_dim)
        return pred, new_hidden


class CycloneTrackModel(nn.Module):
    """
    Encoder-Decoder LSTM for cyclone track prediction.

    Teacher Forcing:
      - During training: use ground truth as next decoder input (p=teacher_forcing_ratio)
      - During inference: use model's own prediction as next input

    Usage:
        model = CycloneTrackModel()
        # Training:
        preds = model(hist_seq, target_seq, teacher_forcing_ratio=0.5)
        # Inference:
        preds = model(hist_seq, target_seq=None, teacher_forcing_ratio=0.0)
    """

    def __init__(
        self,
        input_dim: int = INPUT_FEATURES,
        output_dim: int = OUTPUT_FEATURES,
        hidden_dim: int = 256,
        num_layers: int = 2,
        dropout: float = 0.2,
        decoder_steps: int = DECODER_STEPS,
    ):
        super().__init__()

        self.encoder = TrackEncoder(input_dim, hidden_dim, num_layers, dropout)
        self.decoder = TrackDecoder(output_dim, hidden_dim, num_layers, output_dim, dropout)
        self.decoder_steps = decoder_steps
        self.model_version = MODEL_VERSION

        logger.info(
            f"TrackModel: hidden={hidden_dim}, layers={num_layers}, "
            f"enc_steps={ENCODER_STEPS}, dec_steps={decoder_steps}"
        )

    def forward(
        self,
        src: torch.Tensor,
        trg: Optional[torch.Tensor] = None,
        teacher_forcing_ratio: float = 0.0,
    ) -> torch.Tensor:
        """
        Forward pass.

        Args:
            src: Historical sequence (B, T_enc, input_dim).
            trg: Target sequence (B, T_dec, output_dim). None during inference.
            teacher_forcing_ratio: Prob of using true label as next input during training.

        Returns:
            predictions: (B, T_dec, output_dim) — predicted [lat, lon] sequence.
        """
        B = src.shape[0]
        T_dec = self.decoder_steps

        # Encode
        _, (h, c) = self.encoder(src)

        # Initialize decoder with last observed position
        dec_input = src[:, -1, :OUTPUT_FEATURES]  # (B, 2) — last [lat, lon]

        predictions = []

        for t in range(T_dec):
            # (B, 2) → (1, B, 2) for LSTM
            dec_in = dec_input.unsqueeze(0)
            pred, (h, c) = self.decoder.forward_step(dec_in, (h, c))
            predictions.append(pred)  # (B, 2)

            # Teacher forcing
            if trg is not None and torch.rand(1).item() < teacher_forcing_ratio:
                dec_input = trg[:, t, :]  # use ground truth
            else:
                dec_input = pred.detach()  # use model prediction

        predictions = torch.stack(predictions, dim=1)  # (B, T_dec, 2)
        return predictions

    def predict(
        self,
        history: List[Dict],
        step_hours: int = 3,
    ) -> Dict:
        """
        Generate track prediction from history list.

        Args:
            history: List of dicts [{'lat', 'lon', 'wind_kt', 'pressure_hpa'}]
                     Must have at least 2 entries; ideally ENCODER_STEPS entries.
            step_hours: Hours per time step (default 3h for HURSAT).

        Returns:
            dict with predicted_track list and metadata.
        """
        if len(history) < 2:
            return {
                "success": False,
                "error": "Insufficient historical observations for track prediction. Minimum 2 required.",
                "provided": len(history),
                "minimum_required": 2,
            }

        # Build input tensor — pad/truncate to ENCODER_STEPS
        seq = []
        for h in history[-ENCODER_STEPS:]:   # Use last ENCODER_STEPS steps
            seq.append([
                float(h.get("lat", 0)),
                float(h.get("lon", 0)),
                float(h.get("wind_kt", 0)),
                float(h.get("pressure_hpa", 1000)),
            ])

        # Pad with first observation if sequence is short
        while len(seq) < ENCODER_STEPS:
            seq.insert(0, seq[0])

        src = torch.tensor(seq, dtype=torch.float32).unsqueeze(0)  # (1, T, 4)

        # Normalize (simple: lat/90, lon/180, wind/200, pres/1050)
        norm_factors = torch.tensor([90.0, 180.0, 200.0, 1050.0])
        src_norm = src / norm_factors

        self.eval()
        with torch.no_grad():
            preds = self.forward(src_norm, trg=None, teacher_forcing_ratio=0.0)

        preds_np = (preds[0].cpu() * norm_factors[:2]).numpy()

        predicted_track = []
        for i, (lat, lon) in enumerate(preds_np):
            predicted_track.append({
                "step": i + 1,
                "hours_ahead": (i + 1) * step_hours,
                "lat": round(float(lat), 3),
                "lon": round(float(lon), 3),
            })

        return {
            "success": True,
            "predicted_track": predicted_track,
            "prediction_horizon_hours": len(predicted_track) * step_hours,
            "model_version": self.model_version,
            "data_type": "PREDICTED",
            "uncertainty_note": "Track uncertainty increases with prediction horizon.",
            "disclaimer": (
                "Track prediction is a model estimate. "
                "Do not use for navigation or emergency decisions."
            ),
        }


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute great-circle distance between two lat/lon points.
    Returns distance in kilometers.
    """
    R = 6371.0  # Earth radius (km)
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def haversine_loss(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    """
    Differentiable approximation of Haversine distance loss.
    Used as training loss for track prediction.

    Args:
        pred: (B, T, 2) — predicted [lat, lon] in degrees
        target: (B, T, 2) — true [lat, lon] in degrees
    """
    return F.mse_loss(pred, target)  # MSE in degree space (approximate)


def mean_haversine_error(
    predictions: List[Tuple[float, float]],
    targets: List[Tuple[float, float]],
) -> float:
    """
    Compute mean Haversine distance error in km.

    Args:
        predictions: List of (lat, lon) tuples.
        targets: List of (lat, lon) tuples.

    Returns:
        Mean error in km.
    """
    errors = [
        haversine_distance(p[0], p[1], t[0], t[1])
        for p, t in zip(predictions, targets)
    ]
    return sum(errors) / len(errors) if errors else 0.0


def load_track_model(
    weights_path: Optional[str] = None,
    device: str = "cpu",
) -> CycloneTrackModel:
    """Load track model from weights file."""
    model = CycloneTrackModel()
    if weights_path and Path(weights_path).exists():
        state = torch.load(weights_path, map_location=device)
        if "model_state_dict" in state:
            state = state["model_state_dict"]
        model.load_state_dict(state, strict=False)
        logger.info(f"Loaded track model weights: {weights_path}")
    return model.to(device).eval()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    model = CycloneTrackModel()
    model.eval()

    # Test with dummy history
    history = [
        {"lat": 12.0 + i * 0.4, "lon": 65.0 + i * 0.5, "wind_kt": 45 + i * 5, "pressure_hpa": 1000 - i * 3}
        for i in range(8)
    ]

    result = model.predict(history)
    print(f"Track prediction: {result['success']}")
    print(f"Predicted steps: {len(result['predicted_track'])}")
    for step in result["predicted_track"][:3]:
        print(f"  t+{step['hours_ahead']}h: lat={step['lat']}, lon={step['lon']}")

    # Test Haversine
    dist = haversine_distance(12.0, 65.0, 13.0, 66.0)
    print(f"Haversine distance test: {dist:.1f} km")
    print("Track model smoke test passed ✅")
