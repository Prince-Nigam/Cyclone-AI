"""
Cyclone Classification API
===========================
POST /api/v1/classification/predict
Classifies cyclone intensity pattern from satellite image.
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.ml.model_manager import model_manager
from app.schemas.cyclone import APIResponse, ClassificationResult
from app.utils.file_utils import save_upload, validate_upload

router = APIRouter()


@router.post("/classification/predict", response_model=APIResponse, tags=["Prediction"])
async def classify_cyclone(
    file: UploadFile = File(..., description="Satellite image file"),
    db: Session = Depends(get_db),
):
    """
    Classify cyclone intensity pattern.

    Classes: TD / TS / CAT1 / CAT2 / CAT3_PLUS
    Labels derived from IBTrACS Saffir-Simpson scale.
    All predictions labeled as PREDICTED or SIMULATED.
    """

    validation = await validate_upload(file, settings.MAX_UPLOAD_SIZE_MB)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"error": validation["error"], "code": "INVALID_FILE"})

    save_path = await save_upload(file, settings.UPLOAD_DIR)

    try:
        result = model_manager.analyze(image_path=save_path, history=None, run_xai=False)

        if not result.get("success"):
            raise HTTPException(status_code=422, detail={"error": result.get("error"), "code": "PREDICTION_FAILED"})

        cls = result.get("classification", {})
        return APIResponse(success=True, data=ClassificationResult(**cls).model_dump() if cls else None)

    finally:
        try:
            if os.path.exists(save_path):
                os.remove(save_path)
        except Exception:
            pass
