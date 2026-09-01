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

# Add AI module to path
_ai_path = Path(__file__).parents[4] / "ai"
if str(_ai_path) not in sys.path:
    sys.path.insert(0, str(Path(__file__).parents[4]))

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
        Falls back to mock predictions if models not loaded.
        """
        if self._predictor is not None:
            return self._predictor.analyze(
                image_path=image_path,
                image_array=image_array,
                history=history,
                run_xai=run_xai,
            )
        else:
            return self._mock_analysis()

    def _mock_analysis(self) -> Dict:
        """
        Return clearly labeled mock/demo predictions when models are not loaded.
        Used for development and testing without full ML setup.

        All mock results are labeled: data_type = "SIMULATED"
        """
        logger.warning("Returning SIMULATED predictions (models not loaded)")
        return {
            "success": True,
            "detection": {
                "detected": True,
                "confidence": 0.85,
                "model_version": "detection-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Models not loaded. This is demo data only.",
            },
            "classification": {
                "pattern": "CAT2",
                "pattern_label": "Category 2 Hurricane",
                "wind_range_kt": "83-95",
                "confidence": 0.72,
                "probabilities": {
                    "TD": 0.02,
                    "TS": 0.06,
                    "CAT1": 0.15,
                    "CAT2": 0.72,
                    "CAT3_PLUS": 0.05,
                },
                "model_version": "classification-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Models not loaded. This is demo data only.",
            },
            "intensity": {
                "available": True,
                "predicted_wind_kt": 88.5,
                "predicted_pressure_hpa": 971.2,
                "intensity_class": "CAT2",
                "model_version": "intensity-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Models not loaded. This is demo data only.",
            },
            "track": {
                "available": True,
                "predicted_track": [
                    {"step": i + 1, "hours_ahead": (i + 1) * 3,
                     "lat": 14.0 + (i + 1) * 0.4, "lon": 67.5 + (i + 1) * 0.3}
                    for i in range(8)
                ],
                "model_version": "track-v1",
                "data_type": "SIMULATED",
                "disclaimer": "⚠️ SIMULATED — Models not loaded. This is demo data only.",
            },
            "explainability": {
                "available": False,
                "reason": "Models not loaded — Grad-CAM unavailable",
            },
            "metadata": {
                "data_type": "SIMULATED",
                "inference_time_ms": 0,
                "note": "SIMULATED data — Deploy with trained models for real predictions.",
            },
        }


# Global instance
model_manager = ModelManager.get_instance()
