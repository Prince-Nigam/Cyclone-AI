"""
ML Model Manager
================
Loads and caches all ML models at application startup.
Provides thread-safe access to models for inference.

Models are loaded once and kept in memory.
This avoids re-loading models on every API request.
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Optional

# Add AI module to path — works both locally and on Render
_this_file = Path(__file__).resolve()
# Try different parent levels to find project root
_project_root = None
for _levels in range(2, 6):
    try:
        _candidate = _this_file.parents[_levels]
        if (_candidate / "ai").exists():
            _project_root = _candidate
            break
    except IndexError:
        break

if _project_root is not None:
    _ai_path = _project_root / "ai"
    if str(_project_root) not in sys.path:
        sys.path.insert(0, str(_project_root))

from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Singleton model manager.
    All ML models are loaded once at startup.
    """

    _instance: Optional["ModelManager"] = None

    def __init__(self):
        self.device = settings.INFERENCE_DEVICE
        self._models: Dict = {}
        self._predictor = None
        self._status: Dict[str, str] = {
            "detection": "not_loaded",
            "classification": "not_loaded",
            "intensity": "not_loaded",
            "track": "not_loaded",
        }

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def initialize(self) -> None:
        """
        Load all ML models.
        Called once at application startup (lifespan event).
        """
        logger.info(f"Initializing ML models on device: {self.device}")

        try:
            from ai.inference.predictor import CyclonePredictor

            self._predictor = CyclonePredictor(
                detection_weights=settings.detection_model_full_path,
                classification_weights=settings.classification_model_full_path,
                intensity_weights=settings.intensity_model_full_path,
                track_weights=settings.track_model_full_path,
                device=self.device,
            )

            status = self._predictor.get_model_status()
            self._status = {
                k: v for k, v in status.items()
                if k in ("detection", "classification", "intensity", "track")
            }

            logger.info(f"Model status: {self._status}")

        except ImportError as e:
            logger.warning(
                f"Could not import AI modules: {e}. "
                "Running in demo mode with mock predictions."
            )
            self._predictor = None
        except Exception as e:
            logger.warning(f"Model initialization skipped (demo mode): {e}")
            self._predictor = None

    def get_predictor(self):
        """Return the initialized predictor instance."""
        return self._predictor

    def get_status(self) -> Dict[str, str]:
        """Return status of all models."""
        return self._status.copy()

    def is_ready(self) -> bool:
        """True if at least one model is loaded."""
        return self._predictor is not None

    def analyze(
        self,
        image_path: Optional[str] = None,
        image_array=None,
        history=None,
        run_xai: bool = True,
    ) -> Dict:
        """
        Run full analysis pipeline.
        Falls back to dynamic visual feature simulation if models not loaded.
        """
        if self._predictor is not None:
            return self._predictor.analyze(
                image_path=image_path,
                image_array=image_array,
                history=history,
                run_xai=run_xai,
            )
        else:
            return self._mock_analysis(image_path=image_path, image_array=image_array, run_xai=run_xai)

    def _mock_analysis(
        self,
        image_path: Optional[str] = None,
        image_array=None,
        run_xai: bool = True,
    ) -> Dict:
        """
        Return dynamically computed visual predictions when model weights are not loaded.
        Extracts image statistical properties to provide unique, realistic, and
        scientifically consistent outputs per image.

        All mock results are labeled: data_type = "SIMULATED"
        """
        import hashlib
        import io
        import base64
        import numpy as np
        from PIL import Image

        # Generate a deterministic seed from image
        img_bytes = b""
        img = None
        if image_path and Path(image_path).exists():
            try:
                with open(image_path, "rb") as f:
                    img_bytes = f.read()
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            except Exception:
                img = None

        if img_bytes:
            seed = int(hashlib.md5(img_bytes).hexdigest()[:8], 16)
        else:
            seed = 42

        # Extract basic visual features if image is available
        intensity_score = 0.55
        if img is not None:
            try:
                img_small = img.resize((128, 128))
                arr = np.array(img_small, dtype=np.float32)
                brightness = np.mean(arr)
                h, w, _ = arr.shape
                center = arr[h//4: 3*h//4, w//4: 3*w//4]
                center_b = np.mean(center)
                contrast = abs(center_b - brightness)
                # Thermal IR warm pixels (red high, green low)
                warm_ratio = np.mean((arr[:, :, 0] > 140) & (arr[:, :, 1] < 100))
                intensity_score = float(np.clip((contrast / 80.0) * 0.45 + (warm_ratio * 3.5) * 0.35 + (brightness / 255.0) * 0.2 + ((seed % 15) / 100.0), 0.15, 0.98))
            except Exception:
                intensity_score = 0.55

        # Classify based on intensity score
        if intensity_score < 0.28:
            pattern = "TD"
            pattern_label = "Tropical Depression"
            wind_range = "< 34"
            min_wind, max_wind = 24, 33
            base_pressure = 1005
        elif intensity_score < 0.50:
            pattern = "TS"
            pattern_label = "Tropical Storm"
            wind_range = "34–63"
            min_wind, max_wind = 36, 61
            base_pressure = 994
        elif intensity_score < 0.70:
            pattern = "CAT1"
            pattern_label = "Category 1 Hurricane"
            wind_range = "64–82"
            min_wind, max_wind = 66, 81
            base_pressure = 980
        elif intensity_score < 0.85:
            pattern = "CAT2"
            pattern_label = "Category 2 Hurricane"
            wind_range = "83–95"
            min_wind, max_wind = 84, 94
            base_pressure = 968
        else:
            pattern = "CAT3_PLUS"
            pattern_label = "Category 3+ Major Cyclone"
            wind_range = "≥ 96"
            min_wind, max_wind = 98, 138
            base_pressure = 942

        wind_kt = round(min_wind + (seed % (max_wind - min_wind + 1)))
        pressure_hpa = round(base_pressure - (wind_kt - min_wind) * 0.45)
        confidence = float(np.clip(0.82 + (intensity_score * 0.15) + ((seed % 7) / 100.0), 0.78, 0.97))

        probs = {
            "TD": 0.03,
            "TS": 0.05,
            "CAT1": 0.07,
            "CAT2": 0.08,
            "CAT3_PLUS": 0.04,
        }
        probs[pattern] = float(np.clip(0.65 + (intensity_score * 0.2), 0.65, 0.88))
        rem = (1.0 - probs[pattern]) / 4.0
        for k in probs:
            if k != pattern:
                probs[k] = round(rem, 2)

        start_lat = 12.0 + ((seed % 80) / 10.0)
        start_lon = 65.0 + (((seed >> 2) % 150) / 10.0)

        logger.info(f"Generated dynamic image analysis: {pattern} ({wind_kt} kt, {pressure_hpa} hPa, conf {confidence:.2f})")

        return {
            "success": True,
            "detection": {
                "detected": True,
                "confidence": round(confidence, 3),
                "model_version": "detection-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Prototype inference computed for uploaded satellite image.",
            },
            "classification": {
                "pattern": pattern,
                "pattern_label": pattern_label,
                "wind_range_kt": wind_range,
                "confidence": round(confidence * 0.96, 3),
                "probabilities": probs,
                "model_version": "classification-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Prototype inference computed for uploaded satellite image.",
            },
            "intensity": {
                "available": True,
                "predicted_wind_kt": wind_kt,
                "predicted_pressure_hpa": pressure_hpa,
                "intensity_class": pattern,
                "model_version": "intensity-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Prototype inference computed for uploaded satellite image.",
            },
            "track": {
                "available": True,
                "predicted_track": [
                    {
                        "step": i + 1,
                        "hours_ahead": (i + 1) * 3,
                        "lat": round(start_lat + (i + 1) * 0.42, 2),
                        "lon": round(start_lon + (i + 1) * 0.35, 2),
                    }
                    for i in range(8)
                ],
                "model_version": "track-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Prototype inference computed for uploaded satellite image.",
            },
            "explainability": {
                "available": True,
                "method": "Grad-CAM (Simulated Visual Attention)",
                "target_class": pattern_label,
                "focus_regions": [
                    {
                        "name": "Central Dense Overcast / Eye Wall",
                        "attention_score": round(0.82 + (intensity_score * 0.16), 2),
                        "coordinates": {"x": 112, "y": 112, "radius": 45},
                    }
                ],
            },
            "metadata": {
                "data_type": "SIMULATED",
                "inference_time_ms": 28 + (seed % 20),
                "note": "SIMULATED data — Dynamic image feature analysis computed.",
            },
        }


# Global instance
model_manager = ModelManager.get_instance()
