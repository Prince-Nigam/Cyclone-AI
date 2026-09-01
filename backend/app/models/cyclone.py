"""
SQLAlchemy ORM Models
======================
Database table definitions for the cyclone platform.

Tables:
  - cyclones          : Master cyclone event records
  - track_points      : Per-timestep position/intensity
  - satellite_obs     : Satellite image observations
  - predictions       : ML model predictions
  - ml_models         : Model registry
  - evaluation_results: Training/evaluation metrics
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, JSON, String, Text, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.connection import Base


def generate_uuid():
    return str(uuid.uuid4())


class Cyclone(Base):
    """Master cyclone event record."""
    __tablename__ = "cyclones"

    id = Column(String(50), primary_key=True)          # IBTrACS SID e.g. "2023292N08067"
    name = Column(String(100), nullable=True)           # Storm name
    basin = Column(String(10), nullable=True)           # NI, EP, NA, WP, SP, SI
    subbasin = Column(String(10), nullable=True)        # BB, AS, etc.
    season = Column(Integer, nullable=True)             # Year
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    peak_wind_kt = Column(Float, nullable=True)
    min_pressure_hpa = Column(Float, nullable=True)
    peak_intensity = Column(String(20), nullable=True)  # TD, TS, CAT1, CAT2, CAT3_PLUS
    num_observations = Column(Integer, default=0)
    source = Column(String(50), default="IBTrACS")
    data_type = Column(String(20), default="HISTORICAL")
    status = Column(String(20), default="active")       # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    track_points = relationship("TrackPoint", back_populates="cyclone", cascade="all, delete-orphan")
    observations = relationship("SatelliteObservation", back_populates="cyclone")
    predictions = relationship("Prediction", back_populates="cyclone")

    __table_args__ = (
        Index("ix_cyclones_basin", "basin"),
        Index("ix_cyclones_season", "season"),
        Index("ix_cyclones_peak_intensity", "peak_intensity"),
    )

    def __repr__(self):
        return f"<Cyclone {self.id} {self.name} ({self.basin})>"


class TrackPoint(Base):
    """Single time-step observation in a cyclone track."""
    __tablename__ = "track_points"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cyclone_id = Column(String(50), ForeignKey("cyclones.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    wind_kt = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    intensity_class = Column(String(20), nullable=True)  # TD, TS, CAT1, CAT2, CAT3_PLUS
    source = Column(String(50), default="IBTrACS")
    data_type = Column(String(20), default="HISTORICAL")
    extra_data = Column(JSON, nullable=True)

    # Relationships
    cyclone = relationship("Cyclone", back_populates="track_points")

    __table_args__ = (
        Index("ix_track_points_cyclone_id", "cyclone_id"),
        Index("ix_track_points_timestamp", "timestamp"),
        UniqueConstraint("cyclone_id", "timestamp", name="uq_track_cyclone_time"),
    )

    def __repr__(self):
        return f"<TrackPoint {self.cyclone_id} @ {self.timestamp}>"


class SatelliteObservation(Base):
    """Satellite image observation metadata."""
    __tablename__ = "satellite_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cyclone_id = Column(String(50), ForeignKey("cyclones.id"), nullable=True)
    satellite = Column(String(50), nullable=True)        # HURSAT, INSAT-3D, GOES, etc.
    sensor = Column(String(50), nullable=True)
    timestamp = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_path = Column(String(500), nullable=False)
    channel = Column(String(20), nullable=True)          # IR, VIS, WV, TIR1, etc.
    resolution_km = Column(Float, nullable=True)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    file_format = Column(String(20), nullable=True)
    file_size_mb = Column(Float, nullable=True)
    source = Column(String(50), nullable=True)
    data_type = Column(String(20), default="HISTORICAL")
    is_uploaded = Column(Boolean, default=False)         # True if user-uploaded
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cyclone = relationship("Cyclone", back_populates="observations")

    __table_args__ = (
        Index("ix_sat_obs_cyclone_id", "cyclone_id"),
        Index("ix_sat_obs_timestamp", "timestamp"),
        Index("ix_sat_obs_satellite", "satellite"),
    )

    def __repr__(self):
        return f"<SatelliteObservation {self.satellite} @ {self.timestamp}>"


class Prediction(Base):
    """ML model prediction record."""
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cyclone_id = Column(String(50), ForeignKey("cyclones.id"), nullable=True)
    observation_id = Column(String(36), ForeignKey("satellite_observations.id"), nullable=True)
    model_version = Column(String(50), nullable=True)
    prediction_type = Column(String(30), nullable=False)  # detection/classification/intensity/track/unified
    input_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Detection fields
    detected = Column(Boolean, nullable=True)
    detection_confidence = Column(Float, nullable=True)

    # Classification fields
    predicted_class = Column(String(20), nullable=True)
    classification_confidence = Column(Float, nullable=True)
    class_probabilities = Column(JSON, nullable=True)

    # Intensity fields
    predicted_wind_kt = Column(Float, nullable=True)
    predicted_pressure_hpa = Column(Float, nullable=True)

    # Track fields (JSON array of {step, hours_ahead, lat, lon})
    predicted_track = Column(JSON, nullable=True)

    # XAI
    heatmap_path = Column(String(500), nullable=True)
    xai_method = Column(String(50), nullable=True)

    # Metadata
    data_type = Column(String(20), default="PREDICTED")
    inference_time_ms = Column(Integer, nullable=True)
    fusion_mode = Column(String(30), nullable=True)
    raw_result = Column(JSON, nullable=True)

    # Relationships
    cyclone = relationship("Cyclone", back_populates="predictions")

    __table_args__ = (
        Index("ix_predictions_cyclone_id", "cyclone_id"),
        Index("ix_predictions_type", "prediction_type"),
        Index("ix_predictions_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Prediction {self.prediction_type} {self.model_version}>"


class MLModel(Base):
    """ML model registry."""
    __tablename__ = "ml_models"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), nullable=False)           # detection, classification, etc.
    version = Column(String(20), nullable=False)        # v1, v2, etc.
    architecture = Column(String(50), nullable=True)    # efficientnet_b0, resnet50, etc.
    task = Column(String(30), nullable=False)           # detection, classification, etc.
    status = Column(String(20), default="loaded")       # loaded, not_loaded, error
    weights_path = Column(String(500), nullable=True)
    training_date = Column(DateTime, nullable=True)
    dataset_version = Column(String(50), nullable=True)
    config_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Metrics (nullable — only set after evaluation)
    accuracy = Column(Float, nullable=True)
    precision_score = Column(Float, nullable=True)
    recall_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("name", "version", name="uq_model_name_version"),
    )

    def __repr__(self):
        return f"<MLModel {self.name}-{self.version}>"


class EvaluationResult(Base):
    """Detailed per-metric evaluation results."""
    __tablename__ = "evaluation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("ml_models.id"), nullable=False)
    split = Column(String(10), nullable=False)          # train, val, test
    metric_name = Column(String(50), nullable=False)    # accuracy, f1, mae, etc.
    metric_value = Column(Float, nullable=False)
    class_name = Column(String(20), nullable=True)      # per-class metrics
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_eval_model_id", "model_id"),
    )
