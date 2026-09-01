"""
Cyclones API
=============
GET /api/v1/cyclones        — list with filters + pagination
GET /api/v1/cyclones/{id}   — detail with full track
"""

import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.connection import get_db
from app.models.cyclone import Cyclone, TrackPoint
from app.schemas.cyclone import (
    APIResponse,
    CycloneDetail,
    CycloneListItem,
    CycloneListResponse,
    TrackPointResponse,
)
from app.core.config import settings

router = APIRouter()

VALID_BASINS = {"NI", "EP", "NA", "WP", "SP", "SI"}
VALID_INTENSITIES = {"TD", "TS", "CAT1", "CAT2", "CAT3_PLUS"}


@router.get("/cyclones", response_model=APIResponse, tags=["Cyclones"])
def list_cyclones(
    basin: Optional[str] = Query(None, description="Ocean basin: NI, EP, NA, WP, SP, SI"),
    year: Optional[int] = Query(None, ge=1842, le=2030),
    intensity: Optional[str] = Query(None, description="TD, TS, CAT1, CAT2, CAT3_PLUS"),
    name: Optional[str] = Query(None, description="Search by name (partial match)"),
    page: int = Query(1, ge=1),
    limit: int = Query(None),
    db: Session = Depends(get_db),
):
    """
    List historical cyclones with optional filters.

    All records are labeled as data_type: HISTORICAL (from IBTrACS).
    """
    # Validate parameters
    if basin and basin.upper() not in VALID_BASINS:
        raise HTTPException(
            status_code=400,
            detail={"error": f"Invalid basin '{basin}'. Valid: {sorted(VALID_BASINS)}", "code": "INVALID_PARAMETER"},
        )
    if intensity and intensity.upper() not in VALID_INTENSITIES:
        raise HTTPException(
            status_code=400,
            detail={"error": f"Invalid intensity '{intensity}'. Valid: {sorted(VALID_INTENSITIES)}", "code": "INVALID_PARAMETER"},
        )

    page_size = min(limit or settings.DEFAULT_PAGE_SIZE, settings.MAX_PAGE_SIZE)

    query = db.query(Cyclone)

    if basin:
        query = query.filter(Cyclone.basin == basin.upper())
    if year:
        query = query.filter(Cyclone.season == year)
    if intensity:
        query = query.filter(Cyclone.peak_intensity == intensity.upper())
    if name:
        query = query.filter(Cyclone.name.ilike(f"%{name.upper()}%"))

    total = query.count()
    cyclones = (
        query.order_by(Cyclone.start_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return APIResponse(
        success=True,
        data=CycloneListResponse(
            cyclones=[CycloneListItem.model_validate(c) for c in cyclones],
            total=total,
            page=page,
            pages=math.ceil(total / page_size) if total > 0 else 0,
        ).model_dump(),
    )


@router.get("/cyclones/{cyclone_id}", response_model=APIResponse, tags=["Cyclones"])
def get_cyclone(cyclone_id: str, db: Session = Depends(get_db)):
    """
    Get detailed cyclone information including full track.
    Returns data_type: HISTORICAL for IBTrACS records.
    """
    cyclone = db.query(Cyclone).filter(Cyclone.id == cyclone_id).first()
    if not cyclone:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Cyclone '{cyclone_id}' not found", "code": "CYCLONE_NOT_FOUND"},
        )

    track = (
        db.query(TrackPoint)
        .filter(TrackPoint.cyclone_id == cyclone_id)
        .order_by(TrackPoint.timestamp.asc())
        .all()
    )

    detail = CycloneDetail(
        **CycloneListItem.model_validate(cyclone).model_dump(),
        track=[TrackPointResponse.model_validate(pt) for pt in track],
        observations=[],
    )

    return APIResponse(success=True, data=detail.model_dump())
