"""Models Registry API."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.cyclone import MLModel
from app.schemas.cyclone import APIResponse, MLModelResponse
from app.ml.model_manager import model_manager

router = APIRouter()


@router.get("/models", response_model=APIResponse, tags=["Models"])
def list_models(db: Session = Depends(get_db)):
    """List all registered ML models and their status."""

    db_models = db.query(MLModel).all()
    live_status = model_manager.get_status()

    result = []
    for m in db_models:
        resp = MLModelResponse.model_validate(m)
        # Override status with live runtime status
        if m.name in live_status:
            resp.status = live_status[m.name]
        result.append(resp)

    return APIResponse(success=True, data=[r.model_dump() for r in result])
