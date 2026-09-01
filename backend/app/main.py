"""
Tropical Cyclone AI Platform — FastAPI Application
=====================================================
Main application entry point.

Startup: loads ML models, initializes DB connection, registers routes.
Shutdown: releases resources.

Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging
from app.database.connection import engine, Base
from app.ml.model_manager import model_manager

# Import API routers
from app.api.v1.health import router as health_router
from app.api.v1.models import router as models_router
from app.api.v1.detection import router as detection_router
from app.api.v1.classification import router as classification_router
from app.api.v1.prediction import router as prediction_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.cyclones import router as cyclones_router
from app.api.v1.satellite import router as satellite_router
from app.api.v1.predictions import router as predictions_router

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # ── STARTUP ───────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info("=" * 60)

    # Create DB tables (idempotent)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified")
    except Exception as e:
        logger.error(f"Database setup error: {e}")

    # Seed initial data
    try:
        from app.database.init_db import seed_ml_models, seed_sample_cyclones
        from app.database.connection import SessionLocal
        db = SessionLocal()
        seed_ml_models(db)
        seed_sample_cyclones(db)
        db.close()
        logger.info("Database seeded")
    except Exception as e:
        logger.warning(f"DB seeding skipped: {e}")

    # Load ML models
    try:
        model_manager.initialize()
        logger.info(f"ML models initialized: {model_manager.get_status()}")
    except Exception as e:
        logger.warning(f"ML model initialization warning: {e}")

    # Create upload directory
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    logger.info("Application startup complete")
    logger.info(f"API docs: http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}/docs")

    yield

    # ── SHUTDOWN ──────────────────────────────────────────────────────────────
    logger.info("Application shutting down...")
    # Clean up temp uploads
    try:
        from app.utils.file_utils import cleanup_temp_files
        removed = cleanup_temp_files(settings.UPLOAD_DIR)
        logger.info(f"Cleaned up {removed} temp files")
    except Exception:
        pass
    logger.info("Shutdown complete")


# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI/ML based Tropical Cyclone Identification, Classification and Prediction System. "
        "Built for Smart India Hackathon. "
        "⚠️ Research prototype — NOT an official weather forecasting system."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Global Exception Handler ───────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
        },
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": f"Endpoint not found: {request.url.path}",
            "code": "NOT_FOUND",
        },
    )

# ── Register Routers ──────────────────────────────────────────────────────────

# Health (no prefix)
app.include_router(health_router)

# API v1
API_PREFIX = "/api/v1"

app.include_router(models_router,         prefix=API_PREFIX)
app.include_router(detection_router,      prefix=API_PREFIX)
app.include_router(classification_router, prefix=API_PREFIX)
app.include_router(prediction_router,     prefix=API_PREFIX)
app.include_router(analyze_router,        prefix=API_PREFIX)
app.include_router(cyclones_router,       prefix=API_PREFIX)
app.include_router(satellite_router,      prefix=API_PREFIX)
app.include_router(predictions_router,    prefix=API_PREFIX)


# ── Root Endpoint ─────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():
    """Root endpoint — API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "disclaimer": (
            "⚠️ Research prototype for Smart India Hackathon. "
            "NOT an official weather forecasting system."
        ),
    }


# ── Development server ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
