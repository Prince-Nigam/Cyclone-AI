"""
Predictions History API
========================
GET /api/v1/predictions/{id}  — get stored prediction
GET /api/v1/predictions       — list recent predictions
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.cyclone import Prediction
from app.schemas.cyclone import APIResponse

router = APIRouter()


@router.get("/predictions", response_model=APIResponse, tags=["Predictions"])
def list_predictions(
    cyclone_id: Optional[str] = Query(None),
    prediction_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List stored model predictions."""
    query = db.query(Prediction)
    if cyclone_id:
        query = query.filter(Prediction.cyclone_id == cyclone_id)
    if prediction_type:
        query = query.filter(Prediction.prediction_type == prediction_type)

    total = query.count()
    preds = (
        query.order_by(Prediction.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []
    for p in preds:
        result.append({
            "id": p.id,
            "cyclone_id": p.cyclone_id,
            "prediction_type": p.prediction_type,
            "detected": p.detected,
            "predicted_class": p.predicted_class,
            "detection_confidence": p.detection_confidence,
            "predicted_wind_kt": p.predicted_wind_kt,
            "predicted_pressure_hpa": p.predicted_pressure_hpa,
            "model_version": p.model_version,
            "data_type": p.data_type,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return APIResponse(success=True, data={"predictions": result, "total": total, "page": page})


@router.get("/predictions/{prediction_id}", response_model=APIResponse, tags=["Predictions"])
def get_prediction(prediction_id: str, db: Session = Depends(get_db)):
    """Get a specific prediction by ID."""
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Prediction '{prediction_id}' not found", "code": "NOT_FOUND"},
        )

    return APIResponse(
        success=True,
        data={
            "id": pred.id,
            "cyclone_id": pred.cyclone_id,
            "prediction_type": pred.prediction_type,
            "detected": pred.detected,
            "detection_confidence": pred.detection_confidence,
            "predicted_class": pred.predicted_class,
            "classification_confidence": pred.classification_confidence,
            "class_probabilities": pred.class_probabilities,
            "predicted_wind_kt": pred.predicted_wind_kt,
            "predicted_pressure_hpa": pred.predicted_pressure_hpa,
            "predicted_track": pred.predicted_track,
            "xai_method": pred.xai_method,
            "model_version": pred.model_version,
            "data_type": pred.data_type,
            "inference_time_ms": pred.inference_time_ms,
            "created_at": pred.created_at.isoformat() if pred.created_at else None,
        },
    )
