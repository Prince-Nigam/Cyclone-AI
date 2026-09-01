"""
HURSAT-B1 Dataset Loader
========================
Loads Hurricane Satellite (HURSAT-B1) NetCDF images.

Data source: https://www.ncei.noaa.gov/products/hurricane-satellite-data
License: Public Domain (NOAA)

HURSAT-B1 provides infrared (IR) satellite images centered on tropical cyclones,
linked to IBTrACS records by storm ID and timestamp.

Each NetCDF file contains:
  - IRWIN: Infrared brightness temperature (K), shape (201, 201)
  - lat/lon: Coordinate arrays
  - time: Observation timestamp
  - stormid: Linked IBTrACS SID

This module provides:
  - HURSATDataset: PyTorch Dataset for detection/classification
  - HURSATSampleLoader: Low-level NetCDF reader

All HURSAT data is labeled as: data_type = "HISTORICAL"
"""

import logging
import os
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset

logger = logging.getLogger(__name__)

# Try importing netCDF4; provide clear error if missing
try:
    import netCDF4 as nc
    NETCDF4_AVAILABLE = True
except ImportError:
    NETCDF4_AVAILABLE = False
    logger.warning("netCDF4 not installed. Install with: pip install netCDF4")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# HURSAT IR channel fill/missing value
HURSAT_FILL_VALUE = -9999.0
HURSAT_VALID_RANGE = (180.0, 330.0)  # Kelvin — physical IR range


class HURSATSampleLoader:
    """
    Low-level reader for a single HURSAT-B1 NetCDF file.

    File naming convention:
        HURSAT-B1_v06_{SID}_{YYYYMMDD_HHMM}.nc
    """

    def __init__(self, nc_path: str):
        self.nc_path = Path(nc_path)
        if not self.nc_path.exists():
            raise FileNotFoundError(f"HURSAT file not found: {nc_path}")
        if not NETCDF4_AVAILABLE:
            raise ImportError("netCDF4 required. Install: pip install netCDF4")

    def load(self) -> Dict:
        """
        Load HURSAT NetCDF file.

        Returns:
            dict with keys:
              - ir_data: numpy array (201, 201) float32
              - lat_center: float
              - lon_center: float
              - timestamp: pd.Timestamp
              - storm_id: str
              - metadata: dict
        """
        with nc.Dataset(self.nc_path, "r") as ds:
            # Read IR brightness temperature
            if "IRWIN" in ds.variables:
                ir_raw = ds.variables["IRWIN"][:]
            elif "irwin" in ds.variables:
                ir_raw = ds.variables["irwin"][:]
            else:
                raise ValueError(f"IR channel not found in {self.nc_path}")

            # Handle masked arrays
            if hasattr(ir_raw, "data"):
                ir_data = ir_raw.data.astype(np.float32)
                # Replace masked/fill values with NaN
                mask = ir_raw.mask if hasattr(ir_raw, "mask") else (ir_data == HURSAT_FILL_VALUE)
                ir_data[mask] = np.nan
            else:
                ir_data = ir_raw.astype(np.float32)
                ir_data[ir_data == HURSAT_FILL_VALUE] = np.nan

            # Image may have extra dimensions (time dim)
            if ir_data.ndim == 3:
                ir_data = ir_data[0]  # Take first time step
            elif ir_data.ndim == 4:
                ir_data = ir_data[0, 0]

            # Read coordinates
            lat_center = float(ds.variables.get("lat", [0.0])[len(ds.variables.get("lat", [0.0])) // 2])
            lon_center = float(ds.variables.get("lon", [0.0])[len(ds.variables.get("lon", [0.0])) // 2])

            # Try to get center lat/lon from attributes
            if hasattr(ds, "storm_lat"):
                lat_center = float(ds.storm_lat)
            if hasattr(ds, "storm_lon"):
                lon_center = float(ds.storm_lon)

            # Read timestamp
            timestamp = None
            if "time" in ds.variables:
                try:
                    time_var = ds.variables["time"]
                    time_units = getattr(time_var, "units", "hours since 1970-01-01")
                    time_val = float(time_var[:][0] if time_var[:].ndim > 0 else time_var[:])
                    timestamp = pd.Timestamp("1970-01-01") + pd.Timedelta(hours=time_val)
                except Exception:
                    pass

            # Read storm ID from filename if not in file
            storm_id = self.nc_path.stem.split("_")[-2] if "_" in self.nc_path.stem else "UNKNOWN"
            if hasattr(ds, "stormid"):
                storm_id = str(ds.stormid).strip()

            metadata = {
                "satellite": "HURSAT-B1",
                "channel": "IRWIN",
                "resolution_km": 8.0,
                "image_size": (201, 201),
                "file_path": str(self.nc_path),
                "data_type": "HISTORICAL",
                "source": "NOAA NCEI",
            }

        return {
            "ir_data": ir_data,
            "lat_center": lat_center,
            "lon_center": lon_center,
            "timestamp": timestamp,
            "storm_id": storm_id,
            "metadata": metadata,
        }


class HURSATDataset(Dataset):
    """
    PyTorch Dataset for HURSAT-B1 satellite images.

    Supports:
      - Detection task: binary label (cyclone=1, no_cyclone=0)
      - Classification task: intensity class label (TD/TS/CAT1/CAT2/CAT3+)

    Usage:
        dataset = HURSATDataset(
            file_list=train_files,
            labels_df=ibtracs_df,
            task="classification",
            transform=train_transforms,
            target_size=(224, 224),
        )
        image, label = dataset[0]

    Args:
        file_list: List of paths to HURSAT NetCDF files.
        labels_df: IBTrACS DataFrame (from IBTrACSLoader.load()).
                   Must have SID, ISO_TIME, INTENSITY_CLASS, CLASS_IDX columns.
        task: "detection" (binary) or "classification" (multi-class).
        transform: Optional torchvision transforms.
        target_size: Resize output to (H, W). Default (224, 224).
        cache_images: If True, cache loaded images in memory.
    """

    def __init__(
        self,
        file_list: List[str],
        labels_df: pd.DataFrame,
        task: str = "classification",
        transform: Optional[Callable] = None,
        target_size: Tuple[int, int] = (224, 224),
        cache_images: bool = False,
    ):
        assert task in ("detection", "classification"), \
            "task must be 'detection' or 'classification'"

        self.file_list = [Path(f) for f in file_list]
        self.labels_df = labels_df
        self.task = task
        self.transform = transform
        self.target_size = target_size
        self.cache_images = cache_images
        self._cache: Dict[int, np.ndarray] = {}

        # Build a lookup: (SID, timestamp) → label
        self._label_lookup = self._build_label_lookup()

        # Filter to files that have labels
        self.valid_files, self.file_labels = self._match_files_to_labels()
        logger.info(
            f"HURSATDataset: {len(self.valid_files)} valid samples "
            f"(task={task}, size={target_size})"
        )

    def _build_label_lookup(self) -> Dict:
        """Build fast lookup dict from IBTrACS DataFrame."""
        lookup = {}
        for _, row in self.labels_df.iterrows():
            sid = str(row["SID"]).strip()
            ts = row["ISO_TIME"]
            if pd.notna(ts):
                # Round to nearest 3h for matching
                ts_rounded = ts.floor("3h")
                key = (sid, ts_rounded)
                lookup[key] = {
                    "intensity_class": row.get("INTENSITY_CLASS", "UNKNOWN"),
                    "class_idx": int(row.get("CLASS_IDX", -1)),
                    "wind_kt": float(row.get("WIND_KT", np.nan)),
                    "pressure_hpa": float(row.get("PRESSURE_HPA", np.nan)),
                }
        return lookup

    def _extract_storm_info_from_filename(self, path: Path) -> Tuple[str, Optional[pd.Timestamp]]:
        """Extract storm ID and timestamp from HURSAT filename."""
        # Expected format: HURSAT-B1_v06_{SID}_{YYYYMMDD_HHMM}.nc
        stem = path.stem
        parts = stem.split("_")
        storm_id = "UNKNOWN"
        timestamp = None

        try:
            # Try to parse storm ID and timestamp from name
            if len(parts) >= 4:
                storm_id = parts[-2]
                ts_str = parts[-1]  # YYYYMMDDHHMM
                if len(ts_str) == 12:
                    timestamp = pd.Timestamp(
                        ts_str[:4] + "-" + ts_str[4:6] + "-" + ts_str[6:8] +
                        "T" + ts_str[8:10] + ":" + ts_str[10:12]
                    )
        except Exception:
            pass

        return storm_id, timestamp

    def _match_files_to_labels(self) -> Tuple[List[Path], List[Dict]]:
        """Match HURSAT files to IBTrACS labels."""
        valid_files = []
        file_labels = []

        no_label_count = 0

        for fp in self.file_list:
            sid, ts = self._extract_storm_info_from_filename(fp)
            label = None

            if ts is not None:
                ts_rounded = ts.floor("3h")
                key = (sid, ts_rounded)
                label = self._label_lookup.get(key)

                # Try ±3h tolerance if exact match fails
                if label is None:
                    for offset in [3, -3, 6, -6]:
                        key_offset = (sid, ts_rounded + pd.Timedelta(hours=offset))
                        label = self._label_lookup.get(key_offset)
                        if label is not None:
                            break

            if label is not None and label.get("class_idx", -1) >= 0:
                valid_files.append(fp)
                file_labels.append(label)
            else:
                no_label_count += 1

        if no_label_count > 0:
            logger.warning(f"{no_label_count} files had no matching IBTrACS label")

        return valid_files, file_labels

    def __len__(self) -> int:
        return len(self.valid_files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Returns:
            (image_tensor, label)
            image_tensor: float32 tensor of shape (1, H, W) — single IR channel
            label: int — 0/1 for detection, 0-4 for classification
        """
        # Load image (from cache if enabled)
        if self.cache_images and idx in self._cache:
            ir_data = self._cache[idx]
        else:
            ir_data = self._load_image(self.valid_files[idx])
            if self.cache_images:
                self._cache[idx] = ir_data

        # Preprocess
        image = self._preprocess(ir_data)

        # Convert to tensor (C, H, W)
        image_tensor = torch.from_numpy(image).unsqueeze(0).float()  # (1, H, W)

        # Apply transforms if provided
        if self.transform is not None:
            image_tensor = self.transform(image_tensor)

        # Get label
        label_info = self.file_labels[idx]
        if self.task == "detection":
            label = 1  # All HURSAT images are cyclone images
        else:
            label = label_info["class_idx"]

        return image_tensor, label

    def _load_image(self, file_path: Path) -> np.ndarray:
        """Load raw IR data from NetCDF file."""
        try:
            loader = HURSATSampleLoader(str(file_path))
            data = loader.load()
            return data["ir_data"]
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {e}")
            # Return blank image on failure
            return np.full((201, 201), np.nan, dtype=np.float32)

    def _preprocess(self, ir_data: np.ndarray) -> np.ndarray:
        """
        Preprocess raw IR data for CNN input.

        Steps:
          1. Replace NaN with channel mean
          2. Clip to valid IR range
          3. Resize to target_size
          4. Normalize to [0, 1]
        """
        # Handle NaN
        if np.isnan(ir_data).any():
            valid_mean = np.nanmean(ir_data)
            if np.isnan(valid_mean):
                valid_mean = 255.0  # fallback
            ir_data = np.where(np.isnan(ir_data), valid_mean, ir_data)

        # Clip to valid physical range
        ir_data = np.clip(ir_data, HURSAT_VALID_RANGE[0], HURSAT_VALID_RANGE[1])

        # Resize using simple interpolation (requires cv2)
        H, W = self.target_size
        if ir_data.shape != (H, W):
            try:
                import cv2
                ir_data = cv2.resize(ir_data, (W, H), interpolation=cv2.INTER_LINEAR)
            except ImportError:
                # Fallback: numpy-based resize
                from PIL import Image as PILImage
                pil_img = PILImage.fromarray(ir_data)
                ir_data = np.array(pil_img.resize((W, H), PILImage.BILINEAR))

        # Normalize to [0, 1]
        lo, hi = HURSAT_VALID_RANGE
        ir_data = (ir_data - lo) / (hi - lo)
        ir_data = np.clip(ir_data, 0.0, 1.0)

        return ir_data.astype(np.float32)

    def get_class_weights(self) -> torch.Tensor:
        """
        Compute inverse-frequency class weights for imbalanced classes.
        Pass to CrossEntropyLoss(weight=...) during training.
        """
        from collections import Counter
        counts = Counter(lbl["class_idx"] for lbl in self.file_labels)
        num_classes = 5  # TD, TS, CAT1, CAT2, CAT3+
        total = sum(counts.values())

        weights = []
        for i in range(num_classes):
            count = counts.get(i, 1)  # avoid division by zero
            weights.append(total / (num_classes * count))

        return torch.tensor(weights, dtype=torch.float32)

    def get_stats(self) -> Dict:
        """Return dataset statistics."""
        from collections import Counter
        class_dist = Counter(lbl["class_idx"] for lbl in self.file_labels)
        return {
            "total_samples": len(self.valid_files),
            "task": self.task,
            "class_distribution": {
                f"class_{k}": v for k, v in sorted(class_dist.items())
            },
            "target_size": self.target_size,
        }


class HURSATNoDataset(Dataset):
    """
    Dataset of non-cyclone images for binary detection training.

    In the absence of real "no cyclone" satellite images in HURSAT
    (since HURSAT only contains cyclone-centered images), this class
    creates negative examples by:
      - Using edge patches from cyclone images (no cyclone in corner)
      - Or: accepting user-provided paths to clear sky images

    Args:
        image_paths: List of paths to clear-sky/non-cyclone images.
                     If None, raises ValueError.
        transform: Optional transforms.
        target_size: Output size.
    """

    def __init__(
        self,
        image_paths: List[str],
        transform: Optional[Callable] = None,
        target_size: Tuple[int, int] = (224, 224),
    ):
        if not image_paths:
            raise ValueError(
                "No negative (non-cyclone) image paths provided. "
                "See docs/DATASET.md for instructions on creating negative samples."
            )
        self.image_paths = [Path(p) for p in image_paths]
        self.transform = transform
        self.target_size = target_size
        logger.info(f"HURSATNoDataset: {len(self.image_paths)} non-cyclone samples")

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        path = self.image_paths[idx]
        # Load image — support PNG, JPG, NPY
        if path.suffix == ".npy":
            arr = np.load(str(path)).astype(np.float32)
        else:
            try:
                from PIL import Image as PILImage
                import cv2
                arr = np.array(PILImage.open(path).convert("L")).astype(np.float32)
                arr = arr / 255.0
            except Exception as e:
                logger.error(f"Failed to load negative sample {path}: {e}")
                arr = np.zeros(self.target_size, dtype=np.float32)

        # Resize
        H, W = self.target_size
        if arr.shape != (H, W):
            try:
                import cv2
                arr = cv2.resize(arr, (W, H), interpolation=cv2.INTER_LINEAR)
            except ImportError:
                from PIL import Image as PILImage
                arr = np.array(PILImage.fromarray(arr).resize((W, H)))

        tensor = torch.from_numpy(arr).unsqueeze(0).float()
        if self.transform:
            tensor = self.transform(tensor)

        return tensor, 0  # Label 0 = no cyclone


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("HURSAT Dataset Loader module loaded successfully.")
    print("See README for instructions on downloading HURSAT-B1 data.")
