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

        # ── Strict Cyclone & Satellite Image Validation ─────────────────────
        is_cyclone_image = False
        rejection_reason = "Image does not match a tropical cyclone satellite structure."

        if img is not None:
            try:
                img_arr = np.array(img.resize((128, 128)), dtype=np.float32)
                r = img_arr[:, :, 0]
                g = img_arr[:, :, 1]
                b = img_arr[:, :, 2]
                total_pixels = 128 * 128

                # 1. Skin tone detection (People, Portraits, Selfies)
                skin_mask = (
                    (r > 85) & (g > 35) & (b > 20) &
                    (np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b) > 15) &
                    (np.abs(r - g) > 12) &
                    (r > g) & (r > b) &
                    (g > b * 0.7)
                )
                skin_ratio = float(np.sum(skin_mask) / total_pixels)
                if skin_ratio > 0.05:
                    raise ValueError(f"Image appears to contain a person or portrait ({skin_ratio*100:.1f}% skin tones detected). Please upload a satellite IR image of a tropical cyclone.")

                # 2. Document / Screenshot / Text Image detection
                brightness = 0.299 * r + 0.587 * g + 0.114 * b
                mean_bright = float(np.mean(brightness))
                very_high_bright_ratio = float(np.sum(brightness > 230) / total_pixels)
                high_bright_ratio = float(np.sum(brightness > 200) / total_pixels)

                if very_high_bright_ratio > 0.38 or (high_bright_ratio > 0.48 and mean_bright > 160):
                    raise ValueError(f"Image appears to be a document or text screenshot ({very_high_bright_ratio*100:.1f}% bright paper pixels). Please upload an infrared satellite image of a cyclone.")

                # 3. Natural / Everyday photo color divergence
                rg_diff = float(np.mean(np.abs(r - g)))
                rb_diff = float(np.mean(np.abs(r - b)))
                gb_diff = float(np.mean(np.abs(g - b)))
                channel_diff = (rg_diff + rb_diff + gb_diff) / 3.0

                max_c = np.maximum(np.maximum(r, g), b)
                min_c = np.minimum(np.minimum(r, g), b)
                sat = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-5), 0)
                high_sat_ratio = float(np.sum(sat > 0.30) / total_pixels)

                if channel_diff > 18.0 and high_sat_ratio > 0.20:
                    raise ValueError(f"Image has high natural color saturation ({channel_diff:.1f} color divergence). Cyclone satellite imagery must be thermal infrared or meteorological view.")

                # 4. Storm Convective Cloud Mass Coverage
                cloud_mask = brightness > 125
                cloud_ratio = float(np.sum(cloud_mask) / total_pixels)
                if cloud_ratio < 0.10:
                    raise ValueError("No significant cyclone cloud structure detected (less than 10% storm cloud coverage).")
                if cloud_ratio > 0.90:
                    raise ValueError("Image lacks storm contrast or boundaries (> 90% uniform area).")

                # 5. Vortex Centroid & Multi-Quadrant Spiral Distribution
                y_coords, x_coords = np.where(cloud_mask)
                cx = float(np.mean(x_coords))
                cy = float(np.mean(y_coords))

                if cx < 128 * 0.12 or cx > 128 * 0.88 or cy < 128 * 0.12 or cy > 128 * 0.88:
                    raise ValueError("Cloud mass is off-center or clipped at edges. A cyclone vortex should be centered.")

                q_tl = float(np.sum(cloud_mask[:int(cy), :int(cx)]) / max(1, int(cy) * int(cx)))
                q_tr = float(np.sum(cloud_mask[:int(cy), int(cx):]) / max(1, int(cy) * (128 - int(cx))))
                q_bl = float(np.sum(cloud_mask[int(cy):, :int(cx)]) / max(1, (128 - int(cy)) * int(cx)))
                q_br = float(np.sum(cloud_mask[int(cy):, int(cx):]) / max(1, (128 - int(cy)) * (128 - int(cx))))
                active_quads = sum(1 for q in [q_tl, q_tr, q_bl, q_br] if q > 0.05)

                if active_quads < 3:
                    raise ValueError(f"No circular vortex symmetry detected (clouds present in only {active_quads}/4 quadrants around center).")

                # 6. Straight Cartesian edges (documents/grids vs fluid bands)
                gx = np.zeros_like(brightness)
                gy = np.zeros_like(brightness)
                gx[:, 1:-1] = (brightness[:, 2:] - brightness[:, :-2]) * 0.5
                gy[1:-1, :] = (brightness[2:, :] - brightness[:-2, :]) * 0.5
                mag = np.sqrt(gx**2 + gy**2)
                edge_mask = mag > 12.0
                if np.sum(edge_mask) < 40:
                    raise ValueError("Image lacks distinct cloud band gradients.")

                horiz_or_vert = float(np.sum(
                    ((np.abs(gx[edge_mask]) < 4.0) & (np.abs(gy[edge_mask]) > 12.0)) |
                    ((np.abs(gy[edge_mask]) < 4.0) & (np.abs(gx[edge_mask]) > 12.0))
                ) / np.sum(edge_mask))

                if horiz_or_vert > 0.45:
                    raise ValueError(f"Image is dominated by straight Cartesian lines/grid patterns ({horiz_or_vert*100:.1f}% axis-aligned lines).")

                is_cyclone_image = True
            except ValueError as ve:
                is_cyclone_image = False
                rejection_reason = str(ve)
            except Exception as e:
                logger.warning(f"Cyclone validation error: {e}")
                is_cyclone_image = False
                rejection_reason = "Could not validate image structure. Please upload a valid satellite IR image."
        else:
            rejection_reason = "Could not read image file."

        # ── Reject non-cyclone images ─────────────────────────────────────────
        if not is_cyclone_image:
            logger.info(f"Non-cyclone image rejected: {rejection_reason}")
            return {
                "success": True,
                "detection": {
                    "detected": False,
                    "confidence": 0.0,
                    "model_version": "detection-v1",
                    "data_type": "SIMULATED",
                    "disclaimer": rejection_reason,
                },
                "classification": {"available": False, "reason": rejection_reason},
                "intensity": {"available": False, "reason": rejection_reason},
                "track": {"available": False, "reason": rejection_reason},
                "explainability": {"available": False, "reason": rejection_reason},
                "metadata": {
                    "data_type": "SIMULATED",
                    "inference_time_ms": 12,
                    "note": rejection_reason,
                },
            }

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
