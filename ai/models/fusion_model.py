"""
Multi-Source Satellite Data Fusion Model
=========================================
Implements feature-level fusion from multiple satellite sources.

Architecture: Late Feature Fusion MLP
  - Source A (HURSAT): Image → EfficientNet Encoder → feat_A (1280-dim)
  - Source B (INSAT):  Image → EfficientNet Encoder → feat_B (1280-dim)
  - Fusion: Concatenate [feat_A, feat_B] → MLP → Prediction

Key Design Decisions:
  1. Shared encoder architecture (weight-sharing optional)
  2. Missing source handled with zero vector + warning flag
  3. Extensible: new sources add new encoder branch + update MLP input dim
  4. Two modes: SINGLE_SOURCE (one source only) or MULTI_SOURCE (both)

See docs/MULTI_SOURCE_FUSION.md for architecture details.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

logger = logging.getLogger(__name__)

MODEL_VERSION = "fusion-v1"
ENCODER_FEATURE_DIM = 1280  # EfficientNet-B0 output dimension
NUM_CLASSES = 5              # TD, TS, CAT1, CAT2, CAT3+


class SatelliteEncoder(nn.Module):
    """
    Single-source satellite image encoder.
    Uses EfficientNet-B0 backbone (ImageNet pretrained).
    """

    def __init__(
        self,
        in_channels: int = 1,
        pretrained: bool = True,
        freeze_backbone: bool = False,
    ):
        super().__init__()

        if pretrained:
            backbone = models.efficientnet_b0(
                weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1
            )
        else:
            backbone = models.efficientnet_b0(weights=None)

        # Adapt first conv for in_channels
        if in_channels != 3:
            old_conv = backbone.features[0][0]
            new_conv = nn.Conv2d(
                in_channels, old_conv.out_channels,
                kernel_size=old_conv.kernel_size,
                stride=old_conv.stride,
                padding=old_conv.padding,
                bias=False,
            )
            if pretrained:
                with torch.no_grad():
                    new_conv.weight = nn.Parameter(
                        old_conv.weight.mean(dim=1, keepdim=True)
                    )
            backbone.features[0][0] = new_conv

        self.features = backbone.features
        self.avgpool = backbone.avgpool
        self.feature_dim = ENCODER_FEATURE_DIM

        if freeze_backbone:
            for param in self.features.parameters():
                param.requires_grad = False
            logger.info("Encoder backbone frozen (feature extraction only)")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, in_channels, H, W)
        Returns:
            features: (B, feature_dim)
        """
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        return x


class FusionMLP(nn.Module):
    """
    MLP that fuses features from multiple satellite sources.
    """

    def __init__(
        self,
        input_dim: int,
        hidden_dims: List[int],
        output_dim: int,
        dropout: float = 0.3,
    ):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, output_dim))
        self.net = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class MultiSourceFusionModel(nn.Module):
    """
    Multi-source satellite data fusion model.

    Supports 1 or 2 satellite sources:
      - Source A: HURSAT-B1 (IR, 8km, 3h)
      - Source B: INSAT-3D (TIR1, 4km, 30min) — optional

    When Source B is unavailable, model runs in single-source mode
    with a zero-vector substitution (degraded performance, clearly flagged).

    Outputs:
      - Classification: 5 intensity classes (TD/TS/CAT1/CAT2/CAT3+)
      - Features: 256-dim fused feature vector for downstream models

    Usage:
        model = MultiSourceFusionModel(num_sources=2)
        # Both sources available:
        logits = model(img_a=hursat_img, img_b=insat_img)
        # Only source A:
        logits = model(img_a=hursat_img, img_b=None)
    """

    def __init__(
        self,
        num_sources: int = 2,
        feature_dim: int = ENCODER_FEATURE_DIM,
        num_classes: int = NUM_CLASSES,
        pretrained: bool = True,
        freeze_encoders: bool = False,
        share_encoder_weights: bool = False,
    ):
        """
        Args:
            num_sources: Number of satellite sources (1 or 2+).
            feature_dim: Per-source feature dimension.
            num_classes: Output classes.
            pretrained: Use ImageNet pretrained encoders.
            freeze_encoders: Freeze encoder backbones (feature extraction only).
            share_encoder_weights: Use same weights for all encoders.
        """
        super().__init__()
        self.num_sources = num_sources
        self.feature_dim = feature_dim

        # Encoder A (HURSAT-B1 / primary source)
        self.encoder_a = SatelliteEncoder(
            in_channels=1,
            pretrained=pretrained,
            freeze_backbone=freeze_encoders,
        )

        # Encoder B (INSAT-3D / secondary source)
        if num_sources >= 2:
            if share_encoder_weights:
                self.encoder_b = self.encoder_a  # shared weights
            else:
                self.encoder_b = SatelliteEncoder(
                    in_channels=1,
                    pretrained=pretrained,
                    freeze_backbone=freeze_encoders,
                )
        else:
            self.encoder_b = None

        # Fusion MLP
        fusion_input_dim = feature_dim * num_sources
        self.fusion = FusionMLP(
            input_dim=fusion_input_dim,
            hidden_dims=[512, 256],
            output_dim=256,
            dropout=0.3,
        )

        # Classification head
        self.classifier = nn.Linear(256, num_classes)

        self.model_version = MODEL_VERSION
        logger.info(
            f"FusionModel: sources={num_sources}, feature_dim={feature_dim}, "
            f"fusion_input={fusion_input_dim}, classes={num_classes}"
        )

    def forward(
        self,
        img_a: Optional[torch.Tensor] = None,
        img_b: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Dict]:
        """
        Forward pass with optional sources.

        Args:
            img_a: HURSAT image tensor (B, 1, H, W) or None.
            img_b: INSAT image tensor (B, 1, H, W) or None.

        Returns:
            logits: (B, num_classes)
            fusion_info: dict with source availability and mode
        """
        fusion_info = {
            "source_a_available": img_a is not None,
            "source_b_available": img_b is not None,
        }

        # Encode source A
        if img_a is not None:
            feat_a = self.encoder_a(img_a)
        else:
            B = img_b.shape[0] if img_b is not None else 1
            feat_a = torch.zeros(B, self.feature_dim, device=self._get_device())
            fusion_info["source_a_missing"] = True

        # Encode source B
        if self.num_sources >= 2:
            if img_b is not None and self.encoder_b is not None:
                feat_b = self.encoder_b(img_b)
            else:
                B = feat_a.shape[0]
                feat_b = torch.zeros(B, self.feature_dim, device=self._get_device())
                fusion_info["source_b_missing"] = True
        else:
            feat_b = None

        # Fuse
        if feat_b is not None:
            fused = torch.cat([feat_a, feat_b], dim=1)
            fusion_info["fusion_mode"] = "MULTI_SOURCE"
        else:
            fused = feat_a
            fusion_info["fusion_mode"] = "SINGLE_SOURCE"

        fused_features = self.fusion(fused)
        logits = self.classifier(fused_features)

        return logits, fusion_info

    def get_fused_features(
        self,
        img_a: Optional[torch.Tensor] = None,
        img_b: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Extract fused feature vector (256-dim).
        Used as input to intensity/track models.
        """
        self.eval()
        with torch.no_grad():
            _, _ = self.forward(img_a, img_b)
            # Re-run to get intermediate features
            if img_a is not None:
                feat_a = self.encoder_a(img_a)
            else:
                B = img_b.shape[0] if img_b is not None else 1
                feat_a = torch.zeros(B, self.feature_dim)

            if self.num_sources >= 2 and img_b is not None and self.encoder_b is not None:
                feat_b = self.encoder_b(img_b)
            elif self.num_sources >= 2:
                feat_b = torch.zeros(feat_a.shape[0], self.feature_dim)
            else:
                feat_b = None

            if feat_b is not None:
                fused = torch.cat([feat_a, feat_b], dim=1)
            else:
                fused = feat_a

            return self.fusion(fused)

    def predict(
        self,
        img_a: Optional[torch.Tensor] = None,
        img_b: Optional[torch.Tensor] = None,
    ) -> Dict:
        """Structured prediction with fusion metadata."""
        from ai.models.classification_model import CLASS_NAMES, CLASS_LABELS, CLASS_WIND_RANGES

        self.eval()
        with torch.no_grad():
            logits, fusion_info = self.forward(img_a, img_b)
            probs = F.softmax(logits, dim=1)

        probs_np = probs[0].cpu().numpy()
        pred_idx = int(probs_np.argmax())
        pred_class = CLASS_NAMES[pred_idx]

        missing_sources = []
        if fusion_info.get("source_a_missing"):
            missing_sources.append("HURSAT")
        if fusion_info.get("source_b_missing"):
            missing_sources.append("INSAT-3D")

        return {
            "pattern": pred_class,
            "pattern_label": CLASS_LABELS.get(pred_class, pred_class),
            "wind_range_kt": CLASS_WIND_RANGES.get(pred_class, "unknown"),
            "confidence": round(float(probs_np[pred_idx]), 4),
            "probabilities": {
                cls: round(float(p), 4)
                for cls, p in zip(CLASS_NAMES, probs_np)
            },
            "fusion_mode": fusion_info.get("fusion_mode", "UNKNOWN"),
            "available_sources": [
                s for s, avail in [("HURSAT", not fusion_info.get("source_a_missing")),
                                   ("INSAT-3D", not fusion_info.get("source_b_missing"))]
                if avail
            ],
            "missing_sources": missing_sources,
            "model_version": self.model_version,
            "data_type": "PREDICTED",
        }

    def _get_device(self) -> torch.device:
        return next(self.parameters()).device


def load_fusion_model(
    weights_path: Optional[str] = None,
    num_sources: int = 2,
    device: str = "cpu",
) -> MultiSourceFusionModel:
    """Load fusion model from weights file."""
    model = MultiSourceFusionModel(num_sources=num_sources)
    if weights_path and Path(weights_path).exists():
        state = torch.load(weights_path, map_location=device)
        if "model_state_dict" in state:
            state = state["model_state_dict"]
        model.load_state_dict(state, strict=False)
        logger.info(f"Loaded fusion model: {weights_path}")
    return model.to(device).eval()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    model = MultiSourceFusionModel(num_sources=2, pretrained=False)
    model.eval()

    img_a = torch.randn(2, 1, 224, 224)
    img_b = torch.randn(2, 1, 224, 224)

    # Test multi-source
    logits, info = model(img_a=img_a, img_b=img_b)
    print(f"Multi-source output: logits={logits.shape}, mode={info['fusion_mode']}")

    # Test single-source (B missing)
    logits2, info2 = model(img_a=img_a, img_b=None)
    print(f"Single-source output: logits={logits2.shape}, mode={info2['fusion_mode']}")

    features = model.get_fused_features(img_a=img_a)
    print(f"Fused feature vector shape: {features.shape}")
    print("Fusion model smoke test passed ✅")
