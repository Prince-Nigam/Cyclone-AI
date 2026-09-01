"""
Cyclone Detection Model
=======================
Binary classifier: Cyclone present (1) vs Not present (0).

Architecture: EfficientNet-B0 (ImageNet pretrained, fine-tuned)
  - Input: (B, 1, 224, 224) — single channel IR image
  - Output: (B, 1) — probability of cyclone presence

Why EfficientNet-B0?
  - Compound scaling gives better accuracy per FLOP
  - 5.3M parameters — manageable for CPU inference
  - Strong ImageNet features transfer well to satellite IR
  - Low memory footprint for demo deployment

Data type of predictions: PREDICTED
"""

import logging
from pathlib import Path
from typing import Dict, Optional, Tuple

import torch
import torch.nn as nn
from torchvision import models

logger = logging.getLogger(__name__)

MODEL_VERSION = "detection-v1"
NUM_CLASSES = 1  # Binary: cyclone / no cyclone


class CycloneDetectionModel(nn.Module):
    """
    EfficientNet-B0 based cyclone detection model.

    Modifications from standard EfficientNet-B0:
      1. First conv layer changed from 3-channel to 1-channel (IR only)
      2. Classifier head replaced with binary output
      3. Dropout added for regularization

    Usage:
        model = CycloneDetectionModel(pretrained=True)
        model.eval()
        with torch.no_grad():
            output = model(image_tensor)  # (B, 1)
            prob = torch.sigmoid(output)
    """

    def __init__(
        self,
        pretrained: bool = True,
        dropout_rate: float = 0.3,
        in_channels: int = 1,
    ):
        """
        Args:
            pretrained: Load ImageNet weights. False for random init.
            dropout_rate: Dropout probability in classifier head.
            in_channels: Number of input channels (1 for IR).
        """
        super().__init__()

        # Load EfficientNet-B0
        if pretrained:
            backbone = models.efficientnet_b0(
                weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1
            )
            logger.info("Loaded EfficientNet-B0 with ImageNet weights")
        else:
            backbone = models.efficientnet_b0(weights=None)
            logger.info("Loaded EfficientNet-B0 with random weights")

        # Adapt first conv to accept 1-channel input (IR)
        if in_channels != 3:
            old_conv = backbone.features[0][0]
            new_conv = nn.Conv2d(
                in_channels,
                old_conv.out_channels,
                kernel_size=old_conv.kernel_size,
                stride=old_conv.stride,
                padding=old_conv.padding,
                bias=old_conv.bias is not None,
            )
            # Initialize from ImageNet weights by averaging across channels
            if pretrained:
                with torch.no_grad():
                    new_conv.weight = nn.Parameter(
                        old_conv.weight.mean(dim=1, keepdim=True)
                    )
            backbone.features[0][0] = new_conv
            logger.info(f"Adapted first conv to {in_channels} channel(s)")

        # Keep feature extractor
        self.features = backbone.features
        self.avgpool = backbone.avgpool

        # Get feature dimension from EfficientNet-B0 (1280)
        feature_dim = backbone.classifier[1].in_features

        # Custom binary classifier head
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(feature_dim, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate * 0.7),
            nn.Linear(256, NUM_CLASSES),
        )

        self.model_version = MODEL_VERSION
        self.in_channels = in_channels

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor (B, 1, H, W).

        Returns:
            Logits tensor (B, 1). Apply sigmoid for probability.
        """
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

    def predict(self, x: torch.Tensor, threshold: float = 0.5) -> Dict:
        """
        Run inference and return structured prediction dict.

        Args:
            x: Input tensor (1, 1, H, W) or (B, 1, H, W).
            threshold: Decision threshold for binary classification.

        Returns:
            dict with 'detected', 'confidence', 'model_version', 'data_type'.
        """
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            prob = torch.sigmoid(logits).squeeze()

        confidence = float(prob.item() if prob.dim() == 0 else prob[0].item())
        detected = confidence >= threshold

        return {
            "detected": bool(detected),
            "confidence": round(confidence, 4),
            "model_version": self.model_version,
            "data_type": "PREDICTED",
            "disclaimer": (
                "This is a model prediction, not an official weather observation."
            ),
        }

    def get_feature_vector(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extract feature vector from penultimate layer.
        Used for multi-source fusion and intensity/track models.

        Returns:
            Feature tensor of shape (B, 1280).
        """
        self.eval()
        with torch.no_grad():
            x = self.features(x)
            x = self.avgpool(x)
            x = torch.flatten(x, 1)
        return x


def load_detection_model(
    weights_path: Optional[str] = None,
    device: str = "cpu",
    pretrained_backbone: bool = True,
) -> CycloneDetectionModel:
    """
    Load detection model, optionally from saved weights.

    Args:
        weights_path: Path to .pth weights file. If None, loads pretrained backbone only.
        device: 'cpu' or 'cuda'.
        pretrained_backbone: Whether to use ImageNet pretrained backbone.

    Returns:
        Loaded CycloneDetectionModel.
    """
    model = CycloneDetectionModel(pretrained=pretrained_backbone)

    if weights_path is not None:
        path = Path(weights_path)
        if not path.exists():
            logger.warning(f"Weights file not found: {weights_path}. Using backbone only.")
        else:
            state = torch.load(weights_path, map_location=device)
            # Handle both raw state_dict and checkpoint dict
            if "model_state_dict" in state:
                state = state["model_state_dict"]
            model.load_state_dict(state, strict=False)
            logger.info(f"Loaded detection model weights from: {weights_path}")

    model = model.to(device)
    model.eval()
    return model


def save_detection_model(
    model: CycloneDetectionModel,
    output_path: str,
    extra_info: Optional[Dict] = None,
) -> None:
    """
    Save model weights and metadata.

    Args:
        model: Trained model.
        output_path: Path to save .pth file.
        extra_info: Additional metadata (metrics, config, etc.)
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    checkpoint = {
        "model_state_dict": model.state_dict(),
        "model_version": model.model_version,
        "architecture": "efficientnet_b0",
        "in_channels": model.in_channels,
        "task": "detection",
    }
    if extra_info:
        checkpoint.update(extra_info)

    torch.save(checkpoint, str(path))
    logger.info(f"Detection model saved to: {path}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Quick smoke test
    model = CycloneDetectionModel(pretrained=False)  # False for quick test
    model.eval()

    dummy = torch.randn(2, 1, 224, 224)
    with torch.no_grad():
        output = model(dummy)
        probs = torch.sigmoid(output)

    print(f"Model: {MODEL_VERSION}")
    print(f"Input shape: {dummy.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Sample probabilities: {probs.squeeze().tolist()}")

    result = model.predict(dummy[:1])
    print(f"Prediction: {result}")

    features = model.get_feature_vector(dummy[:1])
    print(f"Feature vector shape: {features.shape}")
    print("Detection model smoke test passed ✅")
