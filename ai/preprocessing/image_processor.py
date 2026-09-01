"""
Image Processor
===============
Handles all satellite image preprocessing for ML training and inference.

Supported input formats:
  - NetCDF (.nc) — HURSAT-B1
  - HDF5 (.h5, .hdf5) — INSAT-3D
  - PNG, JPG, TIFF — uploaded user images

Output:
  - Normalized float32 numpy array of shape (H, W) or (C, H, W)
  - Suitable for CNN input
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# Target image size for CNN input
DEFAULT_TARGET_SIZE = (224, 224)

# Valid IR brightness temperature range (Kelvin)
IR_VALID_MIN = 180.0
IR_VALID_MAX = 330.0


class ImageProcessor:
    """
    Unified image processor for satellite imagery.

    Handles: HURSAT NetCDF, INSAT HDF5, PNG/JPG uploads.

    Usage:
        processor = ImageProcessor(target_size=(224, 224))
        tensor = processor.process_file("path/to/image.nc")
        tensor = processor.process_array(raw_array, channel_type="IR")
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = DEFAULT_TARGET_SIZE,
        normalize: bool = True,
        normalization_stats: Optional[Dict] = None,
    ):
        """
        Args:
            target_size: (H, W) output size.
            normalize: Whether to normalize pixel values.
            normalization_stats: Dict with 'mean' and 'std' keys.
                                 If None, uses min-max normalization.
        """
        self.target_size = target_size
        self.normalize = normalize
        self.normalization_stats = normalization_stats

    def process_file(self, file_path: str) -> np.ndarray:
        """
        Load and preprocess any supported satellite image file.

        Returns:
            float32 numpy array of shape (H, W), values in [0, 1].
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {file_path}")

        suffix = path.suffix.lower()

        if suffix == ".nc":
            return self._process_netcdf(path)
        elif suffix in (".h5", ".hdf5", ".hdf"):
            return self._process_hdf5(path)
        elif suffix in (".png", ".jpg", ".jpeg", ".tif", ".tiff"):
            return self._process_raster(path)
        else:
            raise ValueError(
                f"Unsupported file format: {suffix}. "
                f"Supported: .nc, .h5, .hdf5, .png, .jpg, .tif"
            )

    def process_array(
        self,
        arr: np.ndarray,
        channel_type: str = "IR",
    ) -> np.ndarray:
        """
        Process a raw numpy array through the preprocessing pipeline.

        Args:
            arr: Raw data array (any shape).
            channel_type: "IR", "VIS", "WV" — affects valid range clipping.

        Returns:
            float32 numpy array (H, W), values in [0, 1].
        """
        arr = arr.astype(np.float32)

        # Flatten to 2D if needed
        if arr.ndim > 2:
            arr = arr[0] if arr.shape[0] in (1, 3) else arr[..., 0]

        arr = self._handle_nan(arr)
        arr = self._clip_valid_range(arr, channel_type)
        arr = self._resize(arr)
        if self.normalize:
            arr = self._normalize(arr, channel_type)

        return arr

    # ── Private methods ─────────────────────────────────────────────────────

    def _process_netcdf(self, path: Path) -> np.ndarray:
        """Load IR channel from HURSAT NetCDF."""
        try:
            import netCDF4 as nc_lib
        except ImportError:
            raise ImportError("Install netCDF4: pip install netCDF4")

        with nc_lib.Dataset(str(path), "r") as ds:
            # Find IR variable
            ir_var_name = None
            for name in ["IRWIN", "irwin", "brightness_temp", "BT", "IR"]:
                if name in ds.variables:
                    ir_var_name = name
                    break

            if ir_var_name is None:
                # Try to find any likely variable
                for var in ds.variables:
                    if ds.variables[var].ndim >= 2:
                        ir_var_name = var
                        logger.warning(f"No known IR variable found, using '{var}'")
                        break

            if ir_var_name is None:
                raise ValueError(f"No suitable variable in {path}")

            raw = ds.variables[ir_var_name][:]

        # Handle masked array
        if hasattr(raw, "data"):
            arr = raw.data.astype(np.float32)
            if hasattr(raw, "mask"):
                arr[raw.mask] = np.nan
        else:
            arr = raw.astype(np.float32)
            arr[arr < IR_VALID_MIN - 50] = np.nan  # likely fill values

        return self.process_array(arr, channel_type="IR")

    def _process_hdf5(self, path: Path) -> np.ndarray:
        """Load IR/TIR channel from INSAT-3D HDF5."""
        try:
            import h5py
        except ImportError:
            raise ImportError("Install h5py: pip install h5py")

        with h5py.File(str(path), "r") as f:
            # INSAT-3D typical variable names
            candidates = ["IMG_TIR1", "TIR1", "IR", "IRWIN", "brightness_temp"]
            arr = None
            for key in candidates:
                if key in f:
                    arr = f[key][:]
                    logger.debug(f"Loaded INSAT variable: {key}")
                    break

            if arr is None:
                # Take first 2D+ dataset found
                for key in f.keys():
                    candidate = f[key][:]
                    if candidate.ndim >= 2:
                        arr = candidate
                        logger.warning(f"Using fallback INSAT variable: {key}")
                        break

            if arr is None:
                raise ValueError(f"No suitable variable found in {path}")

        return self.process_array(np.array(arr, dtype=np.float32), channel_type="IR")

    def _process_raster(self, path: Path) -> np.ndarray:
        """Load PNG/JPG/TIFF as grayscale."""
        try:
            from PIL import Image as PILImage
            img = PILImage.open(str(path)).convert("L")
            arr = np.array(img, dtype=np.float32)
        except Exception as e:
            logger.warning(f"PIL failed ({e}), trying OpenCV")
            try:
                import cv2
                arr = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE).astype(np.float32)
            except Exception as e2:
                raise IOError(f"Failed to load image {path}: {e2}")

        # For user-uploaded images, assume grayscale values 0-255
        arr = arr / 255.0

        # Resize if needed
        arr = self._resize_normalized(arr)
        return arr

    def _handle_nan(self, arr: np.ndarray) -> np.ndarray:
        """Replace NaN and inf with channel mean."""
        if not np.isfinite(arr).any():
            logger.warning("Array has no finite values; filling with zeros")
            return np.zeros_like(arr)

        finite_mean = np.nanmean(arr[np.isfinite(arr)])
        arr = np.where(~np.isfinite(arr), finite_mean, arr)
        return arr

    def _clip_valid_range(self, arr: np.ndarray, channel_type: str) -> np.ndarray:
        """Clip to physically valid range for the channel type."""
        if channel_type == "IR":
            return np.clip(arr, IR_VALID_MIN, IR_VALID_MAX)
        elif channel_type == "VIS":
            return np.clip(arr, 0.0, 1.0)
        elif channel_type == "WV":
            return np.clip(arr, 200.0, 300.0)
        else:
            # General: clip at 1st and 99th percentile
            p1, p99 = np.percentile(arr, [1, 99])
            return np.clip(arr, p1, p99)

    def _resize(self, arr: np.ndarray) -> np.ndarray:
        """Resize array to target_size using bilinear interpolation."""
        H, W = self.target_size
        if arr.shape == (H, W):
            return arr
        try:
            import cv2
            return cv2.resize(arr, (W, H), interpolation=cv2.INTER_LINEAR)
        except ImportError:
            from PIL import Image as PILImage
            return np.array(
                PILImage.fromarray(arr).resize((W, H), PILImage.BILINEAR)
            )

    def _resize_normalized(self, arr: np.ndarray) -> np.ndarray:
        """Resize already-normalized [0,1] array."""
        return self._resize(arr)

    def _normalize(self, arr: np.ndarray, channel_type: str = "IR") -> np.ndarray:
        """
        Normalize array to [0, 1].

        If normalization_stats provided, use mean/std standardization.
        Otherwise, use channel-specific min-max normalization.
        """
        if self.normalization_stats:
            mean = self.normalization_stats.get("mean", 0.0)
            std = self.normalization_stats.get("std", 1.0)
            arr = (arr - mean) / (std + 1e-8)
            # Clip to reasonable range after standardization
            arr = np.clip(arr, -3.0, 3.0)
            # Rescale to [0, 1]
            arr = (arr + 3.0) / 6.0
        else:
            # Min-max normalization based on channel type
            if channel_type == "IR":
                lo, hi = IR_VALID_MIN, IR_VALID_MAX
            else:
                lo, hi = arr.min(), arr.max()

            if hi - lo < 1e-8:
                return np.zeros_like(arr)

            arr = (arr - lo) / (hi - lo)

        return np.clip(arr, 0.0, 1.0).astype(np.float32)


class ImageValidator:
    """
    Validates satellite images before processing.

    Returns validation report with any issues found.
    """

    MAX_FILE_SIZE_MB = 50
    SUPPORTED_FORMATS = {".nc", ".h5", ".hdf5", ".hdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"}
    MIN_IMAGE_DIM = 32
    MAX_IMAGE_DIM = 10000

    @classmethod
    def validate_file(cls, file_path: str) -> Dict:
        """
        Validate a file before processing.

        Returns:
            dict with 'valid': bool and 'issues': list of strings.
        """
        path = Path(file_path)
        issues = []

        # Existence
        if not path.exists():
            return {"valid": False, "issues": ["File not found"]}

        # Format
        if path.suffix.lower() not in cls.SUPPORTED_FORMATS:
            issues.append(
                f"Unsupported format: {path.suffix}. "
                f"Supported: {', '.join(cls.SUPPORTED_FORMATS)}"
            )

        # File size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > cls.MAX_FILE_SIZE_MB:
            issues.append(f"File too large: {size_mb:.1f}MB (max {cls.MAX_FILE_SIZE_MB}MB)")

        # Check if file is readable (not corrupted)
        try:
            with open(path, "rb") as f:
                f.read(128)  # Read first bytes
        except Exception as e:
            issues.append(f"File read error: {e}")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "file_size_mb": round(size_mb, 2),
            "format": path.suffix.lower(),
        }

    @classmethod
    def validate_array(cls, arr: np.ndarray) -> Dict:
        """Validate a numpy array."""
        issues = []

        if arr is None or arr.size == 0:
            return {"valid": False, "issues": ["Empty array"]}

        if arr.ndim < 2:
            issues.append(f"Array must be at least 2D, got {arr.ndim}D")

        if arr.shape[-1] < cls.MIN_IMAGE_DIM or arr.shape[-2] < cls.MIN_IMAGE_DIM:
            issues.append(f"Image too small: {arr.shape}")

        nan_pct = np.isnan(arr).mean() * 100
        if nan_pct > 50:
            issues.append(f"Too many NaN values: {nan_pct:.1f}%")

        if not np.isfinite(arr).any():
            issues.append("Array contains no finite values")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "shape": arr.shape,
            "dtype": str(arr.dtype),
            "nan_pct": round(nan_pct, 2),
            "min": float(np.nanmin(arr)) if not np.isnan(arr).all() else None,
            "max": float(np.nanmax(arr)) if not np.isnan(arr).all() else None,
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    processor = ImageProcessor(target_size=(224, 224))
    validator = ImageValidator()
    print("ImageProcessor and ImageValidator loaded successfully.")
    print(f"Target size: {processor.target_size}")
    print(f"Supported formats: {validator.SUPPORTED_FORMATS}")
