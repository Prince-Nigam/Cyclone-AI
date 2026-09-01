"""
Intensity Prediction Model
==========================
Predicts cyclone intensity: max sustained wind (kt) and central pressure (hPa).

Architecture: CNN Feature Extractor + LSTM Regressor
  - CNN: EfficientNet-B0 encoder → 1280-dim feature vector
  - LSTM: Temporal model on [img_features + numeric] sequence
  - Head: Dense regression → [wind_kt, pressure_hPa]

Inputs:
  - Sequence of satellite image tensors (last T time steps)
  - Corresponding numeric features: [lat, lon, prev_wind, prev_pressure]

Output:
  - Predicted wind speed (kt)
  - Predicted pressure (hPa)

Only implemented when sufficient labeled IBTrACS data exists.
Data type of predictions: PREDICTED
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)

MODEL_VERSION = "intensity-v1"
SEQUENCE_LENGTH = 4      # Last 4 time steps (12 hours at 3h intervals)
IMG_FEATURE_DIM = 1280   # EfficientNet-B0 output
NUMERIC_FEATURE_DIM = 4  # lat, lon, prev_wind, prev_pressure
TOTAL_FEATURE_DIM = IMG_FEATURE_DIM + NUMERIC_FEATURE_DIM


class IntensityPredictionModel(nn.Module):
    """
    CNN + LSTM model for cyclone intensity prediction.

    The model combines:
      1. Spatial features from current satellite image (CNN)
      2. Temporal features from intensity history (LSTM)
      3. Numeric meteorological context

    Usage:
        model = IntensityPredictionModel()
        # img_seq: (B, T, 1, 224, 224)
        # num_seq: (B, T, 4)  — [lat, lon, wind_kt, pressure_hpa]
        wind, pressure = model(img_seq, num_seq)
    """

    def __init__(
        self,
        img_feature_dim: int = IMG_FEATURE_DIM,
        numeric_dim: int = NUMERIC_FEATURE_DIM,
        lstm_hidden: int = 256,
        lstm_layers: int = 2,
        lstm_dropout: float = 0.3,
        fc_dropout: float = 0.3,
    ):
        super().__init__()

        self.img_feature_dim = img_feature_dim
        self.numeric_dim = numeric_dim
        input_dim = img_feature_dim + numeric_dim

        # LSTM temporal model
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=lstm_dropout if lstm_layers > 1 else 0.0,
        )

        # Regression head
        self.regressor = nn.Sequential(
            nn.Dropout(fc_dropout),
            nn.Linear(lstm_hidden, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(fc_dropout * 0.5),
            nn.Linear(128, 2),   # [wind_kt, pressure_hpa]
        )

        self.model_version = MODEL_VERSION

        logger.info(
            f"IntensityModel: input_dim={input_dim}, "
            f"lstm_hidden={lstm_hidden}, lstm_layers={lstm_layers}"
        )

    def forward(
        self,
        img_features: torch.Tensor,
        numeric: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.

        Args:
            img_features: (B, T, img_feature_dim) — pre-extracted CNN features
            numeric: (B, T, numeric_dim) — [lat, lon, wind_kt, pressure_hpa]

        Returns:
            wind_pred: (B,) — predicted wind speed (kt)
            pressure_pred: (B,) — predicted pressure (hPa)
        """
        # Concatenate image features and numeric features along feature dim
        x = torch.cat([img_features, numeric], dim=-1)  # (B, T, input_dim)

        # LSTM
        lstm_out, _ = self.lstm(x)                      # (B, T, lstm_hidden)
        last_hidden = lstm_out[:, -1, :]                # (B, lstm_hidden) — last time step

        # Regression
        out = self.regressor(last_hidden)               # (B, 2)
        wind_pred = out[:, 0]                           # wind speed (kt)
        pressure_pred = out[:, 1]                       # pressure (hPa)

        return wind_pred, pressure_pred

    def predict(
        self,
        img_features: torch.Tensor,
        numeric: torch.Tensor,
    ) -> Dict:
        """
        Run inference and return structured prediction dict.

        Args:
            img_features: (1, T, img_feature_dim)
            numeric: (1, T, numeric_dim) — normalized numeric context

        Returns:
            dict with predicted wind, pressure, intensity class.
        """
        self.eval()
        with torch.no_grad():
            wind_pred, pressure_pred = self.forward(img_features, numeric)

        wind_kt = float(wind_pred[0].item())
        pressure_hpa = float(pressure_pred[0].item())

        # Ensure physical bounds
        wind_kt = max(0.0, wind_kt)
        pressure_hpa = max(850.0, min(1015.0, pressure_hpa))

        # Map to intensity class
        intensity_class = _wind_to_class(wind_kt)

        return {
            "predicted_wind_kt": round(wind_kt, 1),
            "predicted_pressure_hpa": round(pressure_hpa, 1),
            "intensity_class": intensity_class,
            "model_version": self.model_version,
            "data_type": "PREDICTED",
            "disclaimer": (
                "Intensity prediction is a model estimate. "
                "Actual intensity may differ significantly. "
                "Not an official forecast."
            ),
        }


class NumericOnlyIntensityModel(nn.Module):
    """
    Simpler intensity model using only numeric track data (no images).
    Useful when satellite images are not available for all time steps.

    Input: (B, T, 4) — [lat, lon, wind_kt, pressure_hpa] sequence
    Output: [wind_kt, pressure_hpa] for next step
    """

    def __init__(
        self,
        input_dim: int = 4,
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0.0,
        )
        self.head = nn.Sequential(
            nn.Linear(lstm_hidden, 64),
            nn.ReLU(),
            nn.Linear(64, 2),
        )
        self.model_version = "intensity-numeric-v1"

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        out, _ = self.lstm(x)
        last = out[:, -1, :]
        pred = self.head(last)
        return pred[:, 0], pred[:, 1]

    def predict(self, history: List[Dict]) -> Dict:
        """
        Args:
            history: List of dicts [{'lat', 'lon', 'wind_kt', 'pressure_hpa'}]
        Returns:
            Prediction dict.
        """
        if len(history) < 2:
            return {
                "error": "Insufficient history",
                "minimum_required": 2,
                "provided": len(history),
            }

        # Build input tensor
        seq = torch.tensor(
            [[h["lat"], h["lon"], h["wind_kt"], h["pressure_hpa"]] for h in history],
            dtype=torch.float32,
        ).unsqueeze(0)  # (1, T, 4)

        self.eval()
        with torch.no_grad():
            wind_pred, pres_pred = self.forward(seq)

        wind_kt = max(0.0, float(wind_pred[0]))
        pressure_hpa = max(850.0, min(1015.0, float(pres_pred[0])))

        return {
            "predicted_wind_kt": round(wind_kt, 1),
            "predicted_pressure_hpa": round(pressure_hpa, 1),
            "intensity_class": _wind_to_class(wind_kt),
            "model_version": self.model_version,
            "data_type": "PREDICTED",
            "disclaimer": "Numeric-only intensity estimate. Satellite image features not used.",
        }


def _wind_to_class(wind_kt: float) -> str:
    """Map wind speed to intensity class."""
    if wind_kt < 34:
        return "TD"
    elif wind_kt < 64:
        return "TS"
    elif wind_kt < 83:
        return "CAT1"
    elif wind_kt < 96:
        return "CAT2"
    else:
        return "CAT3_PLUS"


def load_intensity_model(
    weights_path: Optional[str] = None,
    model_type: str = "numeric",
    device: str = "cpu",
) -> nn.Module:
    """
    Load intensity model.

    Args:
        weights_path: Path to .pth file.
        model_type: "numeric" (simple) or "cnn_lstm" (full).
        device: Torch device.
    """
    if model_type == "cnn_lstm":
        model = IntensityPredictionModel()
    else:
        model = NumericOnlyIntensityModel()

    if weights_path and Path(weights_path).exists():
        state = torch.load(weights_path, map_location=device)
        if "model_state_dict" in state:
            state = state["model_state_dict"]
        model.load_state_dict(state, strict=False)
        logger.info(f"Loaded intensity model weights: {weights_path}")

    return model.to(device).eval()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test NumericOnlyIntensityModel
    model = NumericOnlyIntensityModel()
    history = [
        {"lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998},
        {"lat": 12.8, "lon": 65.8, "wind_kt": 55, "pressure_hpa": 990},
        {"lat": 13.6, "lon": 66.5, "wind_kt": 65, "pressure_hpa": 982},
    ]
    result = model.predict(history)
    print(f"Intensity prediction: {result}")

    # Test full model
    full_model = IntensityPredictionModel()
    img_feats = torch.randn(2, SEQUENCE_LENGTH, IMG_FEATURE_DIM)
    num_feats = torch.randn(2, SEQUENCE_LENGTH, NUMERIC_FEATURE_DIM)
    wind, pres = full_model(img_feats, num_feats)
    print(f"CNN+LSTM wind pred: {wind.shape}, pressure pred: {pres.shape}")
    print("Intensity model smoke test passed ✅")
