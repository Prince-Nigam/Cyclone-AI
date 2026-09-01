"""
Pydantic Schemas — Request & Response Models
=============================================
Used for FastAPI input validation and response serialization.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


# ── Shared base ──────────────────────────────────────────────────────────────

class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Track Point ───────────────────────────────────────────────────────────────

class TrackPointBase(BaseModel):
    timestamp: Optional[datetime] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    wind_kt: Optional[float] = Field(None, ge=0, le=500)
    pressure_hpa: Optional[float] = Field(None, ge=800, le=1030)
    intensity_class: Optional[str] = None
    data_type: str = "HISTORICAL"


class TrackPointResponse(TrackPointBase):
    id: str
    cyclone_id: str
    source: Optional[str] = None

    class Config:
        from_attributes = True


# ── Cyclone ───────────────────────────────────────────────────────────────────

class CycloneListItem(BaseModel):
    id: str
    name: Optional[str] = None
    basin: Optional[str] = None
    season: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    peak_wind_kt: Optional[float] = None
    min_pressure_hpa: Optional[float] = None
    peak_intensity: Optional[str] = None
    num_observations: Optional[int] = None
    source: str = "IBTrACS"
    data_type: str = "HISTORICAL"

    class Config:
        from_attributes = True


class CycloneDetail(CycloneListItem):
    track: List[TrackPointResponse] = []
    observations: List[Dict] = []


class CycloneListResponse(BaseModel):
    cyclones: List[CycloneListItem]
    total: int
    page: int
    pages: int


# ── Satellite Observation ─────────────────────────────────────────────────────

class ObservationResponse(BaseModel):
    id: str
    cyclone_id: Optional[str] = None
    satellite: Optional[str] = None
    timestamp: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_path: Optional[str] = None
    channel: Optional[str] = None
    resolution_km: Optional[float] = None
    data_type: str = "HISTORICAL"
    is_uploaded: bool = False

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    observation_id: str
    file_path: str
    status: str = "uploaded"
    ready_for_analysis: bool = True


# ── ML Prediction Inputs ──────────────────────────────────────────────────────

class HistoryPoint(BaseModel):
    """Single historical track point for prediction input."""
    timestamp: Optional[datetime] = None
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    wind_kt: float = Field(..., ge=0, le=500)
    pressure_hpa: float = Field(..., ge=800, le=1030)


class IntensityPredictRequest(BaseModel):
    cyclone_id: Optional[str] = None
    current_lat: Optional[float] = Field(None, ge=-90, le=90)
    current_lon: Optional[float] = Field(None, ge=-180, le=180)
    history: List[HistoryPoint] = Field(..., min_length=2)


class TrackPredictRequest(BaseModel):
    cyclone_id: Optional[str] = None
    history: List[HistoryPoint] = Field(..., min_length=2)
    prediction_horizon_hours: int = Field(24, ge=6, le=120)


# ── ML Prediction Outputs ─────────────────────────────────────────────────────

class DetectionResult(BaseModel):
    detected: Optional[bool] = None
    confidence: Optional[float] = None
    model_version: Optional[str] = None
    data_type: str = "PREDICTED"
    disclaimer: Optional[str] = None
    error: Optional[str] = None


class ClassificationResult(BaseModel):
    pattern: Optional[str] = None
    pattern_label: Optional[str] = None
    wind_range_kt: Optional[str] = None
    confidence: Optional[float] = None
    probabilities: Optional[Dict[str, float]] = None
    model_version: Optional[str] = None
    data_type: str = "PREDICTED"
    disclaimer: Optional[str] = None
    error: Optional[str] = None


class IntensityResult(BaseModel):
    predicted_wind_kt: Optional[float] = None
    predicted_pressure_hpa: Optional[float] = None
    intensity_class: Optional[str] = None
    model_version: Optional[str] = None
    data_type: str = "PREDICTED"
    available: bool = True
    reason: Optional[str] = None
    disclaimer: Optional[str] = None
    error: Optional[str] = None


class PredictedTrackPoint(BaseModel):
    step: int
    hours_ahead: int
    lat: float
    lon: float


class TrackResult(BaseModel):
    predicted_track: Optional[List[PredictedTrackPoint]] = None
    prediction_horizon_hours: Optional[int] = None
    model_version: Optional[str] = None
    data_type: str = "PREDICTED"
    available: bool = True
    reason: Optional[str] = None
    uncertainty_note: Optional[str] = None
    disclaimer: Optional[str] = None
    error: Optional[str] = None


class ExplainabilityResult(BaseModel):
    heatmap_base64: Optional[str] = None
    method: Optional[str] = None
    method_description: Optional[str] = None
    disclaimer: Optional[str] = None
    available: bool = True
    reason: Optional[str] = None


class UnifiedAnalysisResult(BaseModel):
    detection: Optional[DetectionResult] = None
    classification: Optional[ClassificationResult] = None
    intensity: Optional[IntensityResult] = None
    track: Optional[TrackResult] = None
    explainability: Optional[ExplainabilityResult] = None
    metadata: Optional[Dict] = None


# ── Model Registry ────────────────────────────────────────────────────────────

class MLModelResponse(BaseModel):
    id: str
    name: str
    version: str
    architecture: Optional[str] = None
    task: str
    status: str
    notes: Optional[str] = None
    config_json: Optional[Dict] = None
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None

    class Config:
        from_attributes = True


# ── Health Check ──────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    models: Dict[str, str]
    database: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
