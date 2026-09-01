"""
Intensity & Track Prediction APIs
===================================
POST /api/v1/intensity/predict
POST /api/v1/track/predict
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.ml.model_manager import model_manager
from app.schemas.cyclone import (
    APIResponse,
    IntensityPredictRequest,
    IntensityResult,
    TrackPredictRequest,
    TrackResult,
)

router = APIRouter()


@router.post("/intensity/predict", response_model=APIResponse, tags=["Prediction"])
def predict_intensity(
    request: IntensityPredictRequest,
    db: Session = Depends(get_db),
):
    """
    Predict cyclone intensity (wind speed + pressure).

    Requires at least 2 historical observations.
    Uses CNN+LSTM model trained on IBTrACS data.

    ⚠️ PREDICTED — Not an official forecast.
    """
    if len(request.history) < 2:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Insufficient historical observations for intensity prediction. Minimum 2 required.",
                "code": "INSUFFICIENT_DATA",
                "provided": len(request.history),
                "minimum_required": 2,
            },
        )

    history = [
        {
            "lat": h.lat, "lon": h.lon,
            "wind_kt": h.wind_kt, "pressure_hpa": h.pressure_hpa,
        }
        for h in request.history
    ]

    predictor = model_manager.get_predictor()
    if predictor and predictor.intensity_model:
        try:
            result = predictor.intensity_model.predict(history)
            return APIResponse(success=True, data=IntensityResult(**result).model_dump())
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error": str(e), "code": "PREDICTION_FAILED"})
    else:
        # Demo fallback
        mock = {
            "predicted_wind_kt": round(history[-1]["wind_kt"] * 1.1, 1),
            "predicted_pressure_hpa": round(history[-1]["pressure_hpa"] * 0.99, 1),
            "intensity_class": "TS",
            "model_version": "intensity-v1",
            "data_type": "SIMULATED",
            "disclaimer": "⚠️ SIMULATED — Intensity model not loaded.",
        }
        return APIResponse(success=True, data=mock)


@router.post("/track/predict", response_model=APIResponse, tags=["Prediction"])
def predict_track(
    request: TrackPredictRequest,
    db: Session = Depends(get_db),
):
    """
    Predict future cyclone track (lat/lon sequence).

    Requires at least 2 historical observations.
    Uses Seq2Seq LSTM model trained on IBTrACS data.
    Prediction horizon: up to 24 hours (configurable).

    ⚠️ PREDICTED — Not an official forecast. Do not use for emergency decisions.
    """
    if len(request.history) < 2:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Insufficient historical observations for track prediction. Minimum 2 required.",
                "code": "INSUFFICIENT_DATA",
            },
        )

    history = [
        {
            "lat": h.lat, "lon": h.lon,
            "wind_kt": h.wind_kt, "pressure_hpa": h.pressure_hpa,
        }
        for h in request.history
    ]

    predictor = model_manager.get_predictor()
    if predictor and predictor.track_model:
        try:
            result = predictor.track_model.predict(history)
            return APIResponse(success=True, data=TrackResult(**result).model_dump())
        except Exception as e:
            raise HTTPException(status_code=500, detail={"error": str(e), "code": "PREDICTION_FAILED"})
    else:
        # Demo fallback
        last = history[-1]
        mock_track = [
            {"step": i + 1, "hours_ahead": (i + 1) * 3,
             "lat": round(last["lat"] + (i + 1) * 0.35, 3),
             "lon": round(last["lon"] + (i + 1) * 0.28, 3)}
            for i in range(8)
        ]
        mock = {
            "success": True,
            "predicted_track": mock_track,
            "prediction_horizon_hours": 24,
            "model_version": "track-v1",
            "data_type": "SIMULATED",
            "disclaimer": "⚠️ SIMULATED — Track model not loaded.",
        }
        return APIResponse(success=True, data=mock)
