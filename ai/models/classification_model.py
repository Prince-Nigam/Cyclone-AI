"""
Cyclone Pattern Classification Model
=====================================
Multi-class classifier for cyclone intensity categories.

Architecture: ResNet50 (ImageNet pretrained, fine-tuned)
  - Input: (B, 1, 224, 224) — single channel IR image
  - Output: (B, 5) — logits for 5 intensity classes

Classes (from IBTrACS Saffir-Simpson scale):
  0: TD         — Tropical Depression (<34 kt)
  1: TS         — Tropical Storm (34–63 kt)
  2: CAT1       — Category 1 (64–82 kt)
  3: CAT2       — Category 2 (83–95 kt)
  4: CAT3_PLUS  — Category 3/4/5 (≥96 kt)

Labels derived from IBTrACS usa_wind field — no invented classes.

Data type of predictions: PREDICTED
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

logger = logging.getLogger(__name__)

MODEL_VERSION = "classification-v1"

# Class definitions — derived from IBTrACS + Saffir-Simpson scale
CLASS_NAMES = ["TD", "TS", "CAT1", "CAT2", "CAT3_PLUS"]
CLASS_LABELS = {
    "TD":        "Tropical Depression",
    "TS":        "Tropical Storm",
    "CAT1":      "Category 1 Hurricane",
    "CAT2":      "Category 2 Hurricane",
    "CAT3_PLUS": "Category 3/4/5 (Major Hurricane)",
}
CLASS_WIND_RANGES = {
    "TD":        "< 34 kt",
    "TS":        "34–63 kt",
    "CAT1":      "64–82 kt",
    "CAT2":      "83–95 kt",
    "CAT3_PLUS": "≥ 96 kt",
}
NUM_CLASSES = len(CLASS_NAMES)


class CycloneClassificationModel(nn.Module):
    """
    ResNet50 based cyclone intensity classification model.

    Modifications from standard ResNet50:
      1. First conv adapted for 1-channel input (IR)
      2. Classification head replaced for 5-class output
      3. Dropout added for regularization

    Usage:
        model = CycloneClassificationModel(pretrained=True)
        model.eval()
        with torch.no_grad():
            logits = model(image_tensor)        # (B, 5)
            probs = torch.softmax(logits, dim=1)
            pred_class = probs.argmax(dim=1)
    """

    def __init__(
        self,
        pretrained: bool = True,
        dropout_rate: float = 0.4,
        in_channels: int = 1,
        num_classes: int = NUM_CLASSES,
    ):
        """
        Args:
            pretrained: Load ImageNet weights.
            dropout_rate: Dropout probability in classifier head.
            in_channels: Input channels (1 for IR).
            num_classes: Number of output classes (default: 5).
        """
        super().__init__()

        # Load ResNet50
        if pretrained:
            backbone = models.resnet50(
                weights=models.ResNet50_Weights.IMAGENET1K_V1
            )
            logger.info("Loaded ResNet50 with ImageNet weights")
        else:
            backbone = models.resnet50(weights=None)

        # Adapt first conv for 1-channel input
        if in_channels != 3:
            old_conv = backbone.conv1
            new_conv = nn.Conv2d(
                in_channels,
                old_conv.out_channels,
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
            backbone.conv1 = new_conv
            logger.info(f"Adapted first conv to {in_channels} channel(s)")

        # Feature extractor (everything except final fc)
        self.features = nn.Sequential(
            backbone.conv1,
            backbone.bn1,
            backbone.relu,
            backbone.maxpool,
            backbone.layer1,
            backbone.layer2,
            backbone.layer3,
            backbone.layer4,
        )
        self.avgpool = backbone.avgpool

        # Get feature dimension (ResNet50 = 2048)
        feature_dim = backbone.fc.in_features

        # Custom classifier head
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(feature_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate * 0.75),
            nn.Linear(512, num_classes),
        )

        self.model_version = MODEL_VERSION
        self.in_channels = in_channels
        self.num_classes = num_classes
        self.class_names = CLASS_NAMES[:num_classes]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor (B, 1, H, W).

        Returns:
            Logits tensor (B, num_classes). Apply softmax for probabilities.
        """
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

    def predict(self, x: torch.Tensor) -> Dict:
        """
        Run inference and return structured classification result.

        Args:
            x: Input tensor (1, 1, H, W) or (B, 1, H, W).

        Returns:
            dict with pattern, confidence, probabilities, model_version.
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = F.softmax(logits, dim=1)

        probs_np = probs[0].cpu().numpy()
        pred_idx = int(probs_np.argmax())
        pred_class = CLASS_NAMES[pred_idx]
        confidence = float(probs_np[pred_idx])

        return {
            "pattern": pred_class,
            "pattern_label": CLASS_LABELS.get(pred_class, pred_class),
            "wind_range_kt": CLASS_WIND_RANGES.get(pred_class, "unknown"),
            "class_idx": pred_idx,
            "confidence": round(confidence, 4),
            "probabilities": {
                cls: round(float(p), 4)
                for cls, p in zip(CLASS_NAMES, probs_np)
            },
            "model_version": self.model_version,
            "data_type": "PREDICTED",
            "disclaimer": (
                "Classification based on IR satellite appearance only. "
                "Actual intensity may differ. Not an official forecast."
            ),
        }

    def get_feature_vector(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extract 2048-dim feature vector before classification head.
        Used for multi-source fusion and downstream models.
        """
        self.eval()
        with torch.no_grad():
            x = self.features(x)
            x = self.avgpool(x)
            x = torch.flatten(x, 1)
        return x


class FocalLoss(nn.Module):
    """
    Focal Loss for class imbalance.
    Down-weights easy examples; focuses on hard examples.
    Useful for imbalanced classes (CAT3+ is rare).

    Paper: Lin et al. (2017) — Focal Loss for Dense Object Detection
    """

    def __init__(
        self,
        alpha: Optional[torch.Tensor] = None,
        gamma: float = 2.0,
        reduction: str = "mean",
    ):
        """
        Args:
            alpha: Class weights tensor (shape: [num_classes]).
            gamma: Focusing parameter. Higher = more focus on hard examples.
            reduction: 'mean', 'sum', or 'none'.
        """
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(inputs, targets, weight=self.alpha, reduction="none")
        pt = torch.exp(-ce_loss)
        focal_loss = (1 - pt) ** self.gamma * ce_loss

        if self.reduction == "mean":
            return focal_loss.mean()
        elif self.reduction == "sum":
            return focal_loss.sum()
        return focal_loss


def load_classification_model(
    weights_path: Optional[str] = None,
    device: str = "cpu",
    pretrained_backbone: bool = True,
) -> CycloneClassificationModel:
    """
    Load classification model, optionally from saved weights.
    """
    model = CycloneClassificationModel(pretrained=pretrained_backbone)

    if weights_path is not None:
        path = Path(weights_path)
        if not path.exists():
            logger.warning(f"Weights not found: {weights_path}. Using backbone only.")
        else:
            state = torch.load(weights_path, map_location=device)
            if "model_state_dict" in state:
                state = state["model_state_dict"]
            model.load_state_dict(state, strict=False)
            logger.info(f"Loaded classification weights from: {weights_path}")

    model = model.to(device)
    model.eval()
    return model


def save_classification_model(
    model: CycloneClassificationModel,
    output_path: str,
    extra_info: Optional[Dict] = None,
) -> None:
    """Save classification model checkpoint."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "model_version": model.model_version,
        "architecture": "resnet50",
        "in_channels": model.in_channels,
        "num_classes": model.num_classes,
        "class_names": model.class_names,
        "task": "classification",
    }
    if extra_info:
        checkpoint.update(extra_info)

    torch.save(checkpoint, str(path))
    logger.info(f"Classification model saved to: {path}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    model = CycloneClassificationModel(pretrained=False)
    model.eval()

    dummy = torch.randn(2, 1, 224, 224)
    with torch.no_grad():
        logits = model(dummy)
        probs = F.softmax(logits, dim=1)

    print(f"Model: {MODEL_VERSION}")
    print(f"Input shape: {dummy.shape}")
    print(f"Output shape: {logits.shape}")
    print(f"Classes: {CLASS_NAMES}")

    result = model.predict(dummy[:1])
    print(f"Prediction: pattern={result['pattern']}, confidence={result['confidence']}")
    print(f"Probabilities: {result['probabilities']}")

    features = model.get_feature_vector(dummy[:1])
    print(f"Feature vector shape: {features.shape}")
    print("Classification model smoke test passed ✅")
