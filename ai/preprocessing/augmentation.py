"""
Data Augmentation
=================
Scientifically justified augmentation for satellite imagery.

Rules (from docs/ML_METHODOLOGY.md):
  ✅ Small rotations (±15°) — preserves cyclone structure
  ✅ Horizontal flip (p=0.5) — acceptable for global cyclone dataset
  ✅ Brightness ±10% — sensor calibration variation
  ✅ Contrast ±10% — atmospheric variation
  ✅ Random crop (minor scale variation)

  ❌ Vertical flip alone — destroys cyclone structure
  ❌ Large rotations >30° — unphysical
  ❌ Strong color jitter — satellite data is not color imagery
  ❌ Elastic deformations — would distort cloud structure

Applied ONLY to training set. NOT validation or test.
"""

import logging
from typing import Tuple

import numpy as np
import torch
import torch.nn.functional as F
from torchvision import transforms

logger = logging.getLogger(__name__)


def get_train_transforms(
    target_size: Tuple[int, int] = (224, 224),
    rotation_degrees: float = 15.0,
    brightness: float = 0.1,
    contrast: float = 0.1,
    hflip_prob: float = 0.5,
    crop_scale: Tuple[float, float] = (0.85, 1.0),
) -> transforms.Compose:
    """
    Returns transform pipeline for training images.

    All transformations are scientifically justified for satellite IR imagery.

    Args:
        target_size: Final output size (H, W).
        rotation_degrees: Max rotation angle (±degrees).
        brightness: Brightness jitter factor.
        contrast: Contrast jitter factor.
        hflip_prob: Probability of horizontal flip.
        crop_scale: Range of random crop scale factors.

    Returns:
        torchvision Compose transform.
    """
    H, W = target_size
    return transforms.Compose([
        # Random crop (minor scale variation)
        transforms.RandomResizedCrop(
            size=(H, W),
            scale=crop_scale,
            ratio=(0.95, 1.05),
            interpolation=transforms.InterpolationMode.BILINEAR,
            antialias=True,
        ),

        # Horizontal flip (p=0.5)
        # Justified: cyclones exist in both hemispheres, horizontal mirror acceptable
        transforms.RandomHorizontalFlip(p=hflip_prob),

        # Small rotation
        # Justified: small angular variation from satellite view angle
        transforms.RandomRotation(
            degrees=rotation_degrees,
            interpolation=transforms.InterpolationMode.BILINEAR,
            fill=0.5,  # fill with mid-range normalized value
        ),

        # Brightness and contrast jitter
        # Justified: sensor calibration and atmospheric variation
        # NOTE: For single-channel IR, ColorJitter affects grayscale only
        transforms.ColorJitter(
            brightness=brightness,
            contrast=contrast,
            saturation=0.0,   # no saturation for grayscale
            hue=0.0,          # no hue for grayscale
        ),

        # Ensure tensor format
        # (no ToTensor needed — images already tensors from Dataset)
    ])


def get_val_transforms(
    target_size: Tuple[int, int] = (224, 224),
) -> transforms.Compose:
    """
    Returns minimal transform pipeline for validation/test.
    Only resize — NO augmentation.

    Args:
        target_size: Final output size (H, W).

    Returns:
        torchvision Compose transform.
    """
    H, W = target_size
    return transforms.Compose([
        transforms.Resize(
            (H, W),
            interpolation=transforms.InterpolationMode.BILINEAR,
            antialias=True,
        ),
    ])


def get_inference_transforms(
    target_size: Tuple[int, int] = (224, 224),
) -> transforms.Compose:
    """
    Minimal transforms for inference (same as val — no augmentation).
    """
    return get_val_transforms(target_size)


class TensorAugment:
    """
    Direct tensor-level augmentation for cases where
    torchvision transforms are not applicable.

    Operates on float32 tensors of shape (1, H, W) or (C, H, W).
    """

    @staticmethod
    def random_flip(tensor: torch.Tensor, p: float = 0.5) -> torch.Tensor:
        """Random horizontal flip."""
        if torch.rand(1).item() < p:
            return torch.flip(tensor, dims=[-1])
        return tensor

    @staticmethod
    def random_brightness(
        tensor: torch.Tensor,
        max_delta: float = 0.1,
    ) -> torch.Tensor:
        """Add random brightness offset."""
        delta = (torch.rand(1).item() - 0.5) * 2 * max_delta
        return torch.clamp(tensor + delta, 0.0, 1.0)

    @staticmethod
    def random_rotation_90(tensor: torch.Tensor, p: float = 0.3) -> torch.Tensor:
        """Random 90-degree rotation. More conservative than arbitrary rotation."""
        if torch.rand(1).item() < p:
            k = torch.randint(1, 4, (1,)).item()
            return torch.rot90(tensor, k=k, dims=[-2, -1])
        return tensor

    @staticmethod
    def add_gaussian_noise(
        tensor: torch.Tensor,
        std: float = 0.02,
        p: float = 0.3,
    ) -> torch.Tensor:
        """
        Add small Gaussian noise.
        Justified: sensor noise, quantization effects.
        std should be small relative to signal range.
        """
        if torch.rand(1).item() < p:
            noise = torch.randn_like(tensor) * std
            return torch.clamp(tensor + noise, 0.0, 1.0)
        return tensor

    @classmethod
    def apply_train_augmentation(cls, tensor: torch.Tensor) -> torch.Tensor:
        """Apply full training augmentation pipeline."""
        tensor = cls.random_flip(tensor, p=0.5)
        tensor = cls.random_brightness(tensor, max_delta=0.08)
        tensor = cls.add_gaussian_noise(tensor, std=0.015, p=0.3)
        return tensor


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Test transforms
    dummy_tensor = torch.rand(1, 224, 224)

    train_t = get_train_transforms()
    val_t = get_val_transforms()

    out_train = train_t(dummy_tensor)
    out_val = val_t(dummy_tensor)

    print(f"Train transform output shape: {out_train.shape}")
    print(f"Val transform output shape: {out_val.shape}")

    # Test tensor augmentation
    aug = TensorAugment()
    flipped = aug.random_flip(dummy_tensor)
    noisy = aug.add_gaussian_noise(dummy_tensor)
    print(f"Augmented tensor shape: {noisy.shape}")
    print("Augmentation module loaded successfully.")
