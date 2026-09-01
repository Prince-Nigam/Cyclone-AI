"""Health Check API."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.ml.model_manager import model_manager
from app.schemas.cyclone import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """System health check — returns status of all components."""

    # Check database
    db_status = "connected"
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # Model status
    model_status = model_manager.get_status()

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        models=model_status,
        database=db_status,
        timestamp=datetime.utcnow(),
    )
