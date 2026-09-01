"""
Satellite Observations API
============================
GET  /api/v1/satellite            — list observations
POST /api/v1/satellite/upload     — upload image for analysis
GET  /api/v1/satellite/{id}       — get observation detail
"""

import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.models.cyclone import SatelliteObservation
from app.schemas.cyclone import APIResponse, ObservationResponse, UploadResponse
from app.utils.file_utils import save_upload, validate_upload

router = APIRouter()


@router.get("/satellite", response_model=APIResponse, tags=["Satellite"])
def list_observations(
    cyclone_id: Optional[str] = Query(None),
    satellite: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List satellite observations."""
    query = db.query(SatelliteObservation)

    if cyclone_id:
        query = query.filter(SatelliteObservation.cyclone_id == cyclone_id)
    if satellite:
        query = query.filter(SatelliteObservation.satellite.ilike(f"%{satellite}%"))

    total = query.count()
    observations = (
        query.order_by(SatelliteObservation.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return APIResponse(
        success=True,
        data={
            "observations": [ObservationResponse.model_validate(o).model_dump() for o in observations],
            "total": total,
            "page": page,
        },
    )


@router.post("/satellite/upload", response_model=APIResponse, tags=["Satellite"])
async def upload_observation(
    file: UploadFile = File(...),
    satellite: Optional[str] = Form(default="uploaded"),
    timestamp: Optional[str] = Form(default=None),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    channel: Optional[str] = Form(default="IR"),
    cyclone_id: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
):
    """
    Upload a satellite image for analysis.

    Supported formats: PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5)
    Max size: 50MB
    """
    validation = await validate_upload(file, settings.MAX_UPLOAD_SIZE_MB)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"error": validation["error"], "code": "INVALID_FILE"})

    # Parse timestamp
    obs_time = None
    if timestamp:
        try:
            obs_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            pass

    # Save file
    save_path = await save_upload(file, settings.UPLOAD_DIR, permanent=True)
    file_size_mb = os.path.getsize(save_path) / (1024 * 1024)

    # Create DB record
    obs = SatelliteObservation(
        cyclone_id=cyclone_id,
        satellite=satellite,
        timestamp=obs_time or datetime.utcnow(),
        latitude=latitude,
        longitude=longitude,
        image_path=save_path,
        channel=channel,
        file_format=os.path.splitext(save_path)[1].lstrip("."),
        file_size_mb=round(file_size_mb, 2),
        source="user_upload",
        data_type="OBSERVED",
        is_uploaded=True,
    )
    db.add(obs)
    db.commit()
    db.refresh(obs)

    return APIResponse(
        success=True,
        data=UploadResponse(
            observation_id=obs.id,
            file_path=save_path,
            status="uploaded",
            ready_for_analysis=True,
        ).model_dump(),
    )


@router.get("/satellite/{observation_id}", response_model=APIResponse, tags=["Satellite"])
def get_observation(observation_id: str, db: Session = Depends(get_db)):
    """Get a specific satellite observation by ID."""
    obs = db.query(SatelliteObservation).filter(SatelliteObservation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Observation '{observation_id}' not found", "code": "NOT_FOUND"},
        )
    return APIResponse(success=True, data=ObservationResponse.model_validate(obs).model_dump())
