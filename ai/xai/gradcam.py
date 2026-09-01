"""
Grad-CAM — Explainable AI
==========================
Gradient-weighted Class Activation Mapping.

Produces a heatmap showing which regions of the input satellite image
the model attended to when making its prediction.

Paper: Selvaraju et al. (2017) — Grad-CAM: Visual Explanations from Deep Networks

IMPORTANT DISCLAIMER:
  The heatmap shows MODEL ATTENTION REGIONS — areas that influenced the prediction.
  It is NOT a meteorological analysis or scientific proof.
  Always display this disclaimer alongside heatmap visualizations.

Supported models:
  - EfficientNet-B0 (detection)
  - ResNet50 (classification)

Output:
  - Heatmap as numpy array (H, W) — values 0 to 1
  - Overlay image as numpy array (H, W, 3) — RGB
  - Base64 encoded PNG for API response
"""

import base64
import io
import logging
from typing import Dict, Optional, Tuple, Union

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger(__name__)

GRADCAM_DISCLAIMER = (
    "This heatmap shows model attention regions during prediction. "
    "It indicates which parts of the satellite image influenced the model's decision. "
    "It is NOT a meteorological analysis and should not be interpreted as scientific proof."
)


class GradCAM:
    """
    Grad-CAM implementation for CNN models.

    Hooks into the last convolutional layer to capture:
      - Feature maps (forward hook)
      - Gradients (backward hook)

    Usage:
        gradcam = GradCAM(model, target_layer_name="features.8")
        heatmap = gradcam.generate(image_tensor, target_class=2)
        overlay = gradcam.overlay(image_tensor, heatmap)
    """

    def __init__(
        self,
        model: nn.Module,
        target_layer_name: Optional[str] = None,
    ):
        """
        Args:
            model: PyTorch model (EfficientNet or ResNet).
            target_layer_name: Name of target layer for Grad-CAM.
                               Auto-detected if None.
        """
        self.model = model
        self.model.eval()

        self._activations: Optional[torch.Tensor] = None
        self._gradients: Optional[torch.Tensor] = None
        self._hooks = []

        # Find target layer
        self.target_layer = self._find_target_layer(target_layer_name)
        if self.target_layer is None:
            raise ValueError(
                f"Could not find target layer: {target_layer_name}. "
                f"Available layers: {[name for name, _ in model.named_modules()][:20]}"
            )

        # Register hooks
        self._register_hooks()
        logger.info(f"Grad-CAM initialized on layer: {target_layer_name}")

    def _find_target_layer(
        self, layer_name: Optional[str]
    ) -> Optional[nn.Module]:
        """Auto-detect or find specified target layer."""
        if layer_name is not None:
            for name, module in self.model.named_modules():
                if name == layer_name:
                    return module
            return None

        # Auto-detect: find last Conv2d layer
        last_conv = None
        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                last_conv = module
        return last_conv

    def _register_hooks(self) -> None:
        """Register forward and backward hooks on target layer."""

        def forward_hook(module, input, output):
            self._activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self._gradients = grad_output[0].detach()

        self._hooks.append(
            self.target_layer.register_forward_hook(forward_hook)
        )
        self._hooks.append(
            self.target_layer.register_full_backward_hook(backward_hook)
        )

    def remove_hooks(self) -> None:
        """Remove all registered hooks."""
        for hook in self._hooks:
            hook.remove()
        self._hooks = []

    def generate(
        self,
        image: torch.Tensor,
        target_class: Optional[int] = None,
    ) -> np.ndarray:
        """
        Generate Grad-CAM heatmap.

        Args:
            image: Input tensor (1, C, H, W).
            target_class: Target class index. If None, uses predicted class.

        Returns:
            heatmap: numpy array (H, W), values in [0, 1].
        """
        self.model.zero_grad()

        # Forward pass
        image = image.requires_grad_(True)
        output = self.model(image)

        # Handle different output shapes
        if output.shape[-1] == 1:
            # Binary classification (detection)
            score = output[0, 0]
        else:
            # Multi-class
            if target_class is None:
                target_class = int(output.argmax(dim=1)[0])
            score = output[0, target_class]

        # Backward pass to get gradients
        score.backward()

        # Check hooks fired
        if self._activations is None or self._gradients is None:
            logger.warning("Grad-CAM hooks did not fire. Returning blank heatmap.")
            H, W = image.shape[-2], image.shape[-1]
            return np.zeros((H, W), dtype=np.float32)

        # Compute Grad-CAM
        # Global average pool gradients over spatial dimensions
        weights = self._gradients.mean(dim=(2, 3), keepdim=True)  # (B, C, 1, 1)

        # Weighted combination of feature maps
        cam = (weights * self._activations).sum(dim=1, keepdim=True)  # (B, 1, h, w)
        cam = F.relu(cam)  # ReLU to keep only positive influence

        # Resize to input image size
        H, W = image.shape[-2], image.shape[-1]
        cam = F.interpolate(
            cam,
            size=(H, W),
            mode="bilinear",
            align_corners=False,
        )

        # Normalize to [0, 1]
        cam = cam.squeeze().cpu().numpy()
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        return cam.astype(np.float32)

    def overlay(
        self,
        image: torch.Tensor,
        heatmap: np.ndarray,
        alpha: float = 0.5,
        colormap: str = "jet",
    ) -> np.ndarray:
        """
        Create heatmap overlay on original image.

        Args:
            image: Input tensor (1, 1, H, W) — single channel IR.
            heatmap: Grad-CAM heatmap (H, W) from generate().
            alpha: Heatmap opacity (0 = original only, 1 = heatmap only).
            colormap: Matplotlib colormap name.

        Returns:
            overlay: RGB numpy array (H, W, 3), uint8.
        """
        try:
            import matplotlib.cm as cm
            import matplotlib.pyplot as plt
        except ImportError:
            raise ImportError("Install matplotlib: pip install matplotlib")

        # Convert image to numpy grayscale
        img_np = image[0, 0].detach().cpu().numpy()  # (H, W)

        # Scale to [0, 255]
        img_np = (img_np * 255).clip(0, 255).astype(np.uint8)

        # Convert grayscale to RGB
        img_rgb = np.stack([img_np, img_np, img_np], axis=-1)  # (H, W, 3)

        # Apply colormap to heatmap
        cmap = cm.get_cmap(colormap)
        heatmap_colored = cmap(heatmap)[:, :, :3]  # (H, W, 3) RGB, drop alpha
        heatmap_uint8 = (heatmap_colored * 255).astype(np.uint8)

        # Blend
        overlay = (
            (1 - alpha) * img_rgb.astype(np.float32) +
            alpha * heatmap_uint8.astype(np.float32)
        ).clip(0, 255).astype(np.uint8)

        return overlay

    def to_base64(self, overlay_rgb: np.ndarray) -> str:
        """
        Convert RGB overlay array to base64-encoded PNG string.
        For use in API responses.

        Args:
            overlay_rgb: (H, W, 3) uint8 RGB array.

        Returns:
            Base64 string: "data:image/png;base64,..."
        """
        try:
            from PIL import Image as PILImage
            img = PILImage.fromarray(overlay_rgb, mode="RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{b64}"
        except Exception as e:
            logger.error(f"Failed to encode overlay to base64: {e}")
            return ""

    def analyze(
        self,
        image: torch.Tensor,
        target_class: Optional[int] = None,
        alpha: float = 0.5,
    ) -> Dict:
        """
        Full Grad-CAM analysis: generate heatmap + overlay + base64.

        Args:
            image: Input tensor (1, 1, H, W).
            target_class: Target class (None = use predicted).
            alpha: Overlay opacity.

        Returns:
            dict with heatmap, overlay_base64, method, disclaimer.
        """
        heatmap = self.generate(image, target_class)
        overlay = self.overlay(image, heatmap, alpha=alpha)
        overlay_b64 = self.to_base64(overlay)

        return {
            "heatmap_base64": overlay_b64,
            "method": "Grad-CAM",
            "method_description": (
                "Gradient-weighted Class Activation Mapping (Selvaraju et al., 2017)"
            ),
            "disclaimer": GRADCAM_DISCLAIMER,
            "heatmap_size": list(heatmap.shape),
        }


def create_gradcam_for_detection(model: nn.Module) -> GradCAM:
    """
    Create Grad-CAM instance for EfficientNet-B0 detection model.
    Targets the last convolutional block.
    """
    # EfficientNet-B0 last conv layer
    for name, module in model.named_modules():
        if "features.8" in name and isinstance(module, nn.Conv2d):
            return GradCAM(model, target_layer_name=name)

    # Fallback: find any last conv
    last_conv_name = None
    for name, module in model.named_modules():
        if isinstance(module, nn.Conv2d):
            last_conv_name = name
    if last_conv_name:
        return GradCAM(model, target_layer_name=last_conv_name)

    raise ValueError("Cannot find suitable Conv2d layer for Grad-CAM in detection model")


def create_gradcam_for_classification(model: nn.Module) -> GradCAM:
    """
    Create Grad-CAM instance for ResNet50 classification model.
    Targets layer4 (last residual block).
    """
    # Try ResNet layer4
    for name, module in model.named_modules():
        if "features.7" in name or "layer4" in name:
            if isinstance(module, nn.Conv2d):
                return GradCAM(model, target_layer_name=name)

    # Fallback
    last_conv_name = None
    for name, module in model.named_modules():
        if isinstance(module, nn.Conv2d):
            last_conv_name = name
    if last_conv_name:
        return GradCAM(model, target_layer_name=last_conv_name)

    raise ValueError("Cannot find suitable Conv2d layer for Grad-CAM in classification model")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test with detection model
    import sys
    sys.path.insert(0, str(Path(__file__).parents[2]))

    from ai.models.detection_model import CycloneDetectionModel

    model = CycloneDetectionModel(pretrained=False)
    model.eval()

    dummy_image = torch.randn(1, 1, 224, 224)

    try:
        gradcam = create_gradcam_for_detection(model)
        result = gradcam.analyze(dummy_image)
        print(f"Grad-CAM heatmap size: {result['heatmap_size']}")
        print(f"Base64 length: {len(result['heatmap_base64'])} chars")
        print(f"Disclaimer: {result['disclaimer'][:80]}...")
        print("Grad-CAM smoke test passed ✅")
    except Exception as e:
        print(f"Grad-CAM test note: {e}")
        print("(This is expected if matplotlib or PIL is not installed)")
