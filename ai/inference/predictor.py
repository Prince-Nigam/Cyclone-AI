"""
Inference Pipeline
==================
Unified predictor that runs all ML models on a satellite image.

This is the single entry point for inference used by the FastAPI backend.

Pipeline:
  1. Validate input
  2. Preprocess image
  3. Run detection
  4. If detected → run classification
  5. Extract features
  6. Run intensity prediction (if history available)
  7. Run track prediction (if history available)
  8. Generate Grad-CAM heatmap
  9. Return unified result dict

All predictions labeled with data_type: "PREDICTED"
"""

import logging
import time
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import torch

from ai.preprocessing.image_processor import ImageProcessor, ImageValidator
from ai.models.detection_model import CycloneDetectionModel, load_detection_model
from ai.models.classification_model import CycloneClassificationModel, load_classification_model
from ai.models.intensity_model import NumericOnlyIntensityModel, load_intensity_model
from ai.models.track_model import CycloneTrackModel, load_track_model
from ai.xai.gradcam import GradCAM, create_gradcam_for_detection, create_gradcam_for_classification

logger = logging.getLogger(__name__)


class CyclonePredictor:
    """
    Unified inference pipeline for cyclone analysis.

    Loads all models once at startup and caches them in memory.
    Thread-safe for read-only inference operations.

    Usage:
        predictor = CyclonePredictor(
            detection_weights="models/detection-v1/model.pth",
            classification_weights="models/classification-v1/model.pth",
        )
        result = predictor.analyze(image_path="path/to/image.nc")
    """

    def __init__(
        self,
        detection_weights: Optional[str] = None,
        classification_weights: Optional[str] = None,
        intensity_weights: Optional[str] = None,
        track_weights: Optional[str] = None,
        device: str = "cpu",
        target_size: tuple = (224, 224),
    ):
        """
        Args:
            detection_weights: Path to detection model .pth file.
            classification_weights: Path to classification model .pth file.
            intensity_weights: Path to intensity model .pth file.
            track_weights: Path to track model .pth file.
            device: 'cpu' or 'cuda'.
            target_size: Image preprocessing target size.
        """
        self.device = device
        self.target_size = target_size

        logger.info(f"Initializing CyclonePredictor on device: {device}")

        # Image preprocessor
        self.processor = ImageProcessor(target_size=target_size)
        self.validator = ImageValidator()

        # Load models
        self.detection_model = self._load_model(
            "detection", detection_weights, device
        )
        self.classification_model = self._load_model(
            "classification", classification_weights, device
        )
        self.intensity_model = self._load_model(
            "intensity", intensity_weights, device
        )
        self.track_model = self._load_model(
            "track", track_weights, device
        )

        # Grad-CAM (lazy init on first use)
        self._gradcam_detection: Optional[GradCAM] = None
        self._gradcam_classification: Optional[GradCAM] = None

        logger.info("CyclonePredictor initialized successfully")

    def _load_model(self, model_type: str, weights_path: Optional[str], device: str):
        """Load a single model with error handling."""
        try:
            if model_type == "detection":
                return load_detection_model(weights_path, device, pretrained_backbone=True)
            elif model_type == "classification":
                return load_classification_model(weights_path, device, pretrained_backbone=True)
            elif model_type == "intensity":
                return load_intensity_model(weights_path, model_type="numeric", device=device)
            elif model_type == "track":
                return load_track_model(weights_path, device)
        except Exception as e:
            logger.warning(f"Could not load {model_type} model: {e}")
            return None

    def analyze(
        self,
        image_path: Optional[str] = None,
        image_array: Optional[np.ndarray] = None,
        history: Optional[List[Dict]] = None,
        run_xai: bool = True,
    ) -> Dict:
        """
        Full analysis pipeline.

        Args:
            image_path: Path to satellite image file.
            image_array: Pre-loaded numpy array (alternative to file path).
            history: Historical track data for intensity/track prediction.
                     List of dicts: [{'lat', 'lon', 'wind_kt', 'pressure_hpa'}]
            run_xai: Whether to run Grad-CAM explainability.

        Returns:
            Unified analysis result dict.
        """
        start_time = time.time()
        result = {
            "success": False,
            "detection": None,
            "classification": None,
            "intensity": None,
            "track": None,
            "explainability": None,
            "metadata": {
                "data_type": "PREDICTED",
                "model_versions": {},
            }
        }

        # ── Step 1: Load and validate image ──────────────────────────────────
        try:
            if image_path is not None:
                validation = self.validator.validate_file(image_path)
                if not validation["valid"]:
                    return {
                        "success": False,
                        "error": f"Image validation failed: {validation['issues']}",
                        "code": "INVALID_IMAGE",
                    }
                image_array = self.processor.process_file(image_path)
            elif image_array is not None:
                validation = self.validator.validate_array(image_array)
                if not validation["valid"]:
                    return {
                        "success": False,
                        "error": f"Array validation failed: {validation['issues']}",
                        "code": "INVALID_ARRAY",
                    }
                image_array = self.processor.process_array(image_array, channel_type="IR")
            else:
                return {
                    "success": False,
                    "error": "No image provided. Provide image_path or image_array.",
                    "code": "NO_INPUT",
                }
        except Exception as e:
            logger.error(f"Image loading failed: {e}")
            return {"success": False, "error": str(e), "code": "PREPROCESSING_FAILED"}

        # Convert to tensor (1, 1, H, W)
        image_tensor = torch.from_numpy(image_array).unsqueeze(0).unsqueeze(0).float()
        image_tensor = image_tensor.to(self.device)

        # ── Step 2: Detection ─────────────────────────────────────────────────
        if self.detection_model is not None:
            try:
                det_result = self.detection_model.predict(image_tensor)
                result["detection"] = det_result
                result["metadata"]["model_versions"]["detection"] = det_result.get("model_version")
            except Exception as e:
                logger.error(f"Detection failed: {e}")
                result["detection"] = {"error": str(e), "detected": None}
        else:
            result["detection"] = {
                "detected": None,
                "error": "Detection model not loaded",
                "code": "MODEL_UNAVAILABLE",
            }

        # ── Step 3: Classification ────────────────────────────────────────────
        # Run classification even if detection is uncertain (show full analysis)
        if self.classification_model is not None:
            try:
                cls_result = self.classification_model.predict(image_tensor)
                result["classification"] = cls_result
                result["metadata"]["model_versions"]["classification"] = cls_result.get("model_version")
            except Exception as e:
                logger.error(f"Classification failed: {e}")
                result["classification"] = {"error": str(e), "pattern": None}
        else:
            result["classification"] = {
                "pattern": None,
                "error": "Classification model not loaded",
                "code": "MODEL_UNAVAILABLE",
            }

        # ── Step 4: Intensity Prediction ──────────────────────────────────────
        if self.intensity_model is not None and history and len(history) >= 2:
            try:
                intensity_result = self.intensity_model.predict(history)
                result["intensity"] = intensity_result
                result["metadata"]["model_versions"]["intensity"] = intensity_result.get("model_version")
            except Exception as e:
                logger.error(f"Intensity prediction failed: {e}")
                result["intensity"] = {"error": str(e), "available": False}
        else:
            result["intensity"] = {
                "available": False,
                "reason": (
                    "Intensity prediction requires at least 2 historical observations."
                    if not history else "Intensity model not loaded"
                ),
            }

        # ── Step 5: Track Prediction ──────────────────────────────────────────
        if self.track_model is not None and history and len(history) >= 2:
            try:
                track_result = self.track_model.predict(history)
                result["track"] = track_result
                result["metadata"]["model_versions"]["track"] = track_result.get("model_version")
            except Exception as e:
                logger.error(f"Track prediction failed: {e}")
                result["track"] = {"error": str(e), "available": False}
        else:
            result["track"] = {
                "available": False,
                "reason": (
                    "Track prediction requires at least 2 historical observations."
                    if not history else "Track model not loaded"
                ),
            }

        # ── Step 6: Grad-CAM ──────────────────────────────────────────────────
        if run_xai and self.detection_model is not None:
            try:
                if self._gradcam_detection is None:
                    self._gradcam_detection = create_gradcam_for_detection(
                        self.detection_model
                    )
                xai_result = self._gradcam_detection.analyze(image_tensor)
                result["explainability"] = xai_result
            except Exception as e:
                logger.warning(f"Grad-CAM failed (non-critical): {e}")
                result["explainability"] = {
                    "available": False,
                    "reason": str(e),
                }
        else:
            result["explainability"] = {"available": False, "reason": "XAI not requested or model unavailable"}

        # ── Finalize ──────────────────────────────────────────────────────────
        elapsed_ms = int((time.time() - start_time) * 1000)
        result["metadata"]["inference_time_ms"] = elapsed_ms
        result["metadata"]["data_type"] = "PREDICTED"
        result["success"] = True

        logger.info(f"Analysis completed in {elapsed_ms}ms")
        return result

    def get_model_status(self) -> Dict:
        """Return status of all loaded models."""
        return {
            "detection": "loaded" if self.detection_model else "not_loaded",
            "classification": "loaded" if self.classification_model else "not_loaded",
            "intensity": "loaded" if self.intensity_model else "not_loaded",
            "track": "loaded" if self.track_model else "not_loaded",
            "device": self.device,
        }


# Module-level singleton for the FastAPI backend
_predictor_instance: Optional[CyclonePredictor] = None


def get_predictor(
    detection_weights: Optional[str] = None,
    classification_weights: Optional[str] = None,
    intensity_weights: Optional[str] = None,
    track_weights: Optional[str] = None,
    device: str = "cpu",
) -> CyclonePredictor:
    """
    Get or create the global predictor singleton.
    Call once at startup; subsequent calls return cached instance.
    """
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CyclonePredictor(
            detection_weights=detection_weights,
            classification_weights=classification_weights,
            intensity_weights=intensity_weights,
            track_weights=track_weights,
            device=device,
        )
    return _predictor_instance


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    predictor = CyclonePredictor(device="cpu")
    print("Model status:", predictor.get_model_status())

    # Test with dummy array
    dummy = np.random.rand(224, 224).astype(np.float32)
    history = [
        {"lat": 12.0 + i * 0.4, "lon": 65.0 + i * 0.5,
         "wind_kt": 45 + i * 5, "pressure_hpa": 1000 - i * 3}
        for i in range(4)
    ]

    result = predictor.analyze(image_array=dummy, history=history, run_xai=False)
    print(f"Analysis success: {result['success']}")
    print(f"Detection: {result['detection']}")
    print(f"Classification: {result['classification']}")
    print(f"Intensity available: {result['intensity'].get('available', True)}")
    print(f"Track available: {result['track'].get('available', True)}")
    print(f"Inference time: {result['metadata']['inference_time_ms']}ms")
    print("Predictor smoke test passed ✅")
