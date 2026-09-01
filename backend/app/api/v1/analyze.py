"""
Unified Analysis API
=====================
POST /api/v1/analyze
Runs the complete analysis pipeline on a single satellite image.
Returns: detection + classification + intensity + track + Grad-CAM
"""

import json
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.ml.model_manager import model_manager
from app.models.cyclone import Prediction
from app.schemas.cyclone import APIResponse, UnifiedAnalysisResult
from app.utils.file_utils import save_upload, validate_upload

router = APIRouter()


@router.post("/analyze", response_model=APIResponse, tags=["Analysis"])
async def unified_analysis(
    file: UploadFile = File(..., description="Satellite image file"),
    cyclone_history: Optional[str] = Form(
        default=None,
        description="JSON string: list of {lat, lon, wind_kt, pressure_hpa}"
    ),
    cyclone_id: Optional[str] = Form(default=None),
    run_xai: bool = Form(default=True),
    db: Session = Depends(get_db),
):
    """
    Run the complete AI analysis pipeline on a satellite image.

    Returns:
    - Cyclone detection (detected / not detected + confidence)
    - Pattern classification (intensity class + probabilities)
    - Intensity prediction (wind speed, pressure) if history provided
    - Track prediction (future path) if history provided
    - Explainable AI heatmap (Grad-CAM) if available

    ⚠️ All results labeled as PREDICTED or SIMULATED.
    Not an official weather forecast.
    """

    # ── Validate file ─────────────────────────────────────────────────────────
    validation = await validate_upload(file, settings.MAX_UPLOAD_SIZE_MB)
    if not validation["valid"]:
        raise HTTPException(
            status_code=400,
            detail={"error": validation["error"], "code": "INVALID_FILE"},
        )

    # ── Parse history ─────────────────────────────────────────────────────────
    history = None
    if cyclone_history:
        try:
            history_raw = json.loads(cyclone_history)
            history = [
                {
                    "lat": float(h.get("lat", h.get("latitude", 0))),
                    "lon": float(h.get("lon", h.get("longitude", 0))),
                    "wind_kt": float(h.get("wind_kt", 0)),
                    "pressure_hpa": float(h.get("pressure_hpa", 1000)),
                }
                for h in history_raw
            ]
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise HTTPException(
                status_code=400,
                detail={"error": f"Invalid cyclone_history JSON: {e}", "code": "INVALID_INPUT"},
            )

    # ── Save uploaded file ────────────────────────────────────────────────────
    save_path = await save_upload(file, settings.UPLOAD_DIR)

    try:
        # ── Run full analysis ─────────────────────────────────────────────────
        result = model_manager.analyze(
            image_path=save_path,
            history=history,
            run_xai=run_xai,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=422,
                detail={"error": result.get("error", "Analysis failed"), "code": "PREDICTION_FAILED"},
            )

        # ── Store prediction in DB ────────────────────────────────────────────
        try:
            det = result.get("detection", {})
            cls = result.get("classification", {})
            intensity = result.get("intensity", {})
            track = result.get("track", {})

            prediction = Prediction(
                cyclone_id=cyclone_id,
                model_version="v1",
                prediction_type="unified",
                input_timestamp=datetime.utcnow(),
                detected=det.get("detected"),
                detection_confidence=det.get("confidence"),
                predicted_class=cls.get("pattern"),
                classification_confidence=cls.get("confidence"),
                class_probabilities=cls.get("probabilities"),
                predicted_wind_kt=intensity.get("predicted_wind_kt"),
                predicted_pressure_hpa=intensity.get("predicted_pressure_hpa"),
                predicted_track=track.get("predicted_track"),
                data_type="PREDICTED",
                inference_time_ms=result.get("metadata", {}).get("inference_time_ms"),
                raw_result={k: v for k, v in result.items() if k != "explainability"},  # don't store base64
            )
            db.add(prediction)
            db.commit()
            db.refresh(prediction)
            result["metadata"]["prediction_id"] = prediction.id
        except Exception as db_err:
            # DB failure is non-critical; continue with response
            result["metadata"]["db_warning"] = str(db_err)

        return APIResponse(success=True, data=result)

    finally:
        # Clean up temp file
        try:
            if os.path.exists(save_path):
                os.remove(save_path)
        except Exception:
            pass
