"""
Cyclone Detection API
=====================
POST /api/v1/detection/predict
Detects cyclone presence in an uploaded satellite image.
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.ml.model_manager import model_manager
from app.schemas.cyclone import APIResponse, DetectionResult
from app.utils.file_utils import save_upload, validate_upload

router = APIRouter()


@router.post("/detection/predict", response_model=APIResponse, tags=["Prediction"])
async def detect_cyclone(
    file: UploadFile = File(..., description="Satellite image file"),
    satellite_source: Optional[str] = Form(default="unknown"),
    db: Session = Depends(get_db),
):
    """
    Detect cyclone presence in a satellite image.

    - Accepts: PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5)
    - Returns: detected (bool), confidence (float), model version
    - All predictions labeled as data_type: PREDICTED or SIMULATED
    """

    # Validate upload
    validation = await validate_upload(file, settings.MAX_UPLOAD_SIZE_MB)
    if not validation["valid"]:
        raise HTTPException(
            status_code=400,
            detail={"error": validation["error"], "code": "INVALID_FILE"},
        )

    # Save to temp location
    save_path = await save_upload(file, settings.UPLOAD_DIR)

    try:
        # Run inference
        result = model_manager.analyze(
            image_path=save_path,
            history=None,
            run_xai=False,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=422,
                detail={"error": result.get("error", "Analysis failed"), "code": "PREDICTION_FAILED"},
            )

        det = result.get("detection", {})
        return APIResponse(
            success=True,
            data=DetectionResult(**det).model_dump() if det else None,
        )

    finally:
        # Clean up temp file
        try:
            if os.path.exists(save_path):
                os.remove(save_path)
        except Exception:
            pass
