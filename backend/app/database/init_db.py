"""
Database Initialization
========================
Creates all tables and seeds default data.
Run once before starting the server.

Usage:
    python -m app.database.init_db
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parents[3]))

from app.database.connection import engine, Base, SessionLocal
from app.models.cyclone import Cyclone, TrackPoint, MLModel, SatelliteObservation

logger = logging.getLogger(__name__)


def create_tables() -> None:
    """Create all database tables."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully.")


def seed_ml_models(db) -> None:
    """Register default ML models in the model registry."""
    models_to_seed = [
        {
            "id": "detection-v1-id",
            "name": "detection",
            "version": "v1",
            "architecture": "efficientnet_b0",
            "task": "detection",
            "status": "not_loaded",
            "notes": "EfficientNet-B0 binary cyclone detection model. Pretrained on ImageNet, fine-tuned on HURSAT-B1.",
            "config_json": {
                "input_size": [224, 224],
                "in_channels": 1,
                "dropout_rate": 0.3,
                "threshold": 0.5,
            },
        },
        {
            "id": "classification-v1-id",
            "name": "classification",
            "version": "v1",
            "architecture": "resnet50",
            "task": "classification",
            "status": "not_loaded",
            "notes": "ResNet50 cyclone intensity classification. Classes: TD/TS/CAT1/CAT2/CAT3+.",
            "config_json": {
                "input_size": [224, 224],
                "in_channels": 1,
                "num_classes": 5,
                "classes": ["TD", "TS", "CAT1", "CAT2", "CAT3_PLUS"],
            },
        },
        {
            "id": "intensity-v1-id",
            "name": "intensity",
            "version": "v1",
            "architecture": "lstm",
            "task": "intensity_prediction",
            "status": "not_loaded",
            "notes": "LSTM intensity prediction. Input: historical [lat,lon,wind,pressure]. Output: wind_kt, pressure_hpa.",
            "config_json": {
                "input_dim": 4,
                "lstm_hidden": 128,
                "lstm_layers": 2,
                "sequence_length": 4,
            },
        },
        {
            "id": "track-v1-id",
            "name": "track",
            "version": "v1",
            "architecture": "seq2seq_lstm",
            "task": "track_prediction",
            "status": "not_loaded",
            "notes": "Seq2Seq LSTM track prediction. Predicts 24h future path.",
            "config_json": {
                "encoder_steps": 8,
                "decoder_steps": 8,
                "hidden_dim": 256,
                "num_layers": 2,
                "step_hours": 3,
            },
        },
    ]

    for model_data in models_to_seed:
        existing = db.query(MLModel).filter_by(
            name=model_data["name"], version=model_data["version"]
        ).first()
        if not existing:
            ml_model = MLModel(**model_data)
            db.add(ml_model)
            logger.info(f"Seeded model: {model_data['name']}-{model_data['version']}")

    db.commit()


def seed_sample_cyclones(db) -> None:
    """Seed a few well-known cyclones for demo purposes."""
    sample_cyclones = [
        {
            "id": "2023_NI_BIPARJOY",
            "name": "BIPARJOY",
            "basin": "NI",
            "season": 2023,
            "start_time": datetime(2023, 6, 6),
            "end_time": datetime(2023, 6, 19),
            "peak_wind_kt": 115.0,
            "min_pressure_hpa": 944.0,
            "peak_intensity": "CAT3_PLUS",
            "source": "IBTrACS",
            "data_type": "HISTORICAL",
            "num_observations": 52,
        },
        {
            "id": "2021_NI_TAUKTAE",
            "name": "TAUKTAE",
            "basin": "NI",
            "season": 2021,
            "start_time": datetime(2021, 5, 13),
            "end_time": datetime(2021, 5, 19),
            "peak_wind_kt": 130.0,
            "min_pressure_hpa": 916.0,
            "peak_intensity": "CAT3_PLUS",
            "source": "IBTrACS",
            "data_type": "HISTORICAL",
            "num_observations": 48,
        },
        {
            "id": "2020_NI_AMPHAN",
            "name": "AMPHAN",
            "basin": "NI",
            "season": 2020,
            "start_time": datetime(2020, 5, 13),
            "end_time": datetime(2020, 5, 21),
            "peak_wind_kt": 150.0,
            "min_pressure_hpa": 907.0,
            "peak_intensity": "CAT3_PLUS",
            "source": "IBTrACS",
            "data_type": "HISTORICAL",
            "num_observations": 64,
        },
        {
            "id": "2019_NI_FANI",
            "name": "FANI",
            "basin": "NI",
            "season": 2019,
            "start_time": datetime(2019, 4, 26),
            "end_time": datetime(2019, 5, 4),
            "peak_wind_kt": 140.0,
            "min_pressure_hpa": 932.0,
            "peak_intensity": "CAT3_PLUS",
            "source": "IBTrACS",
            "data_type": "HISTORICAL",
            "num_observations": 64,
        },
        {
            "id": "2018_NI_GAJA",
            "name": "GAJA",
            "basin": "NI",
            "season": 2018,
            "start_time": datetime(2018, 11, 11),
            "end_time": datetime(2018, 11, 16),
            "peak_wind_kt": 75.0,
            "min_pressure_hpa": 978.0,
            "peak_intensity": "CAT1",
            "source": "IBTrACS",
            "data_type": "HISTORICAL",
            "num_observations": 40,
        },
    ]

    for cyclone_data in sample_cyclones:
        existing = db.query(Cyclone).filter_by(id=cyclone_data["id"]).first()
        if not existing:
            cyclone = Cyclone(**cyclone_data)
            db.add(cyclone)
            logger.info(f"Seeded cyclone: {cyclone_data['name']} ({cyclone_data['id']})")

    db.commit()

    # Add sample track points for BIPARJOY
    biparjoy_track = [
        {"timestamp": datetime(2023, 6, 6, 0), "lat": 11.0, "lon": 67.4, "wind_kt": 25, "pressure_hpa": 1004, "class": "TD"},
        {"timestamp": datetime(2023, 6, 7, 0), "lat": 11.5, "lon": 67.0, "wind_kt": 35, "pressure_hpa": 998, "class": "TS"},
        {"timestamp": datetime(2023, 6, 8, 0), "lat": 12.2, "lon": 67.3, "wind_kt": 45, "pressure_hpa": 990, "class": "TS"},
        {"timestamp": datetime(2023, 6, 9, 0), "lat": 13.0, "lon": 67.8, "wind_kt": 55, "pressure_hpa": 982, "class": "TS"},
        {"timestamp": datetime(2023, 6, 10, 0), "lat": 13.8, "lon": 67.5, "wind_kt": 65, "pressure_hpa": 975, "class": "CAT1"},
        {"timestamp": datetime(2023, 6, 11, 0), "lat": 14.6, "lon": 67.1, "wind_kt": 75, "pressure_hpa": 968, "class": "CAT1"},
        {"timestamp": datetime(2023, 6, 12, 0), "lat": 15.5, "lon": 67.0, "wind_kt": 90, "pressure_hpa": 958, "class": "CAT2"},
        {"timestamp": datetime(2023, 6, 13, 0), "lat": 16.5, "lon": 67.5, "wind_kt": 105, "pressure_hpa": 948, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2023, 6, 14, 0), "lat": 17.5, "lon": 66.8, "wind_kt": 115, "pressure_hpa": 944, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2023, 6, 15, 0), "lat": 19.0, "lon": 65.5, "wind_kt": 100, "pressure_hpa": 952, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2023, 6, 16, 0), "lat": 21.0, "lon": 64.5, "wind_kt": 80, "pressure_hpa": 965, "class": "CAT2"},
        {"timestamp": datetime(2023, 6, 17, 0), "lat": 22.5, "lon": 63.5, "wind_kt": 65, "pressure_hpa": 975, "class": "CAT1"},
        {"timestamp": datetime(2023, 6, 18, 0), "lat": 24.0, "lon": 63.0, "wind_kt": 45, "pressure_hpa": 988, "class": "TS"},
        {"timestamp": datetime(2023, 6, 19, 0), "lat": 25.5, "lon": 62.5, "wind_kt": 30, "pressure_hpa": 997, "class": "TD"},
    ]

    existing_pts = db.query(TrackPoint).filter_by(cyclone_id="2023_NI_BIPARJOY").count()
    if existing_pts == 0:
        for pt in biparjoy_track:
            track_point = TrackPoint(
                cyclone_id="2023_NI_BIPARJOY",
                timestamp=pt["timestamp"],
                latitude=pt["lat"],
                longitude=pt["lon"],
                wind_kt=pt["wind_kt"],
                pressure_hpa=pt["pressure_hpa"],
                intensity_class=pt["class"],
                source="IBTrACS",
                data_type="HISTORICAL",
            )
            db.add(track_point)
        db.commit()
        logger.info("Seeded BIPARJOY track points")

    # ── TAUKTAE track (Arabian Sea, May 2021) ────────────────────────────────
    tauktae_track = [
        {"timestamp": datetime(2021, 5, 13, 0), "lat": 10.2, "lon": 72.5, "wind_kt": 30, "pressure_hpa": 1000, "class": "TD"},
        {"timestamp": datetime(2021, 5, 14, 0), "lat": 11.0, "lon": 72.0, "wind_kt": 45, "pressure_hpa": 992, "class": "TS"},
        {"timestamp": datetime(2021, 5, 15, 0), "lat": 12.5, "lon": 71.5, "wind_kt": 65, "pressure_hpa": 978, "class": "CAT1"},
        {"timestamp": datetime(2021, 5, 16, 0), "lat": 14.0, "lon": 71.0, "wind_kt": 90, "pressure_hpa": 960, "class": "CAT2"},
        {"timestamp": datetime(2021, 5, 16, 12), "lat": 15.5, "lon": 71.0, "wind_kt": 110, "pressure_hpa": 942, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2021, 5, 17, 0), "lat": 17.0, "lon": 71.5, "wind_kt": 130, "pressure_hpa": 916, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2021, 5, 17, 12), "lat": 19.0, "lon": 71.8, "wind_kt": 120, "pressure_hpa": 924, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2021, 5, 18, 0), "lat": 20.5, "lon": 72.0, "wind_kt": 95, "pressure_hpa": 945, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2021, 5, 18, 12), "lat": 21.8, "lon": 72.5, "wind_kt": 70, "pressure_hpa": 966, "class": "CAT1"},
        {"timestamp": datetime(2021, 5, 19, 0), "lat": 22.5, "lon": 72.8, "wind_kt": 45, "pressure_hpa": 984, "class": "TS"},
    ]
    existing_pts = db.query(TrackPoint).filter_by(cyclone_id="2021_NI_TAUKTAE").count()
    if existing_pts == 0:
        for pt in tauktae_track:
            db.add(TrackPoint(
                cyclone_id="2021_NI_TAUKTAE",
                timestamp=pt["timestamp"], latitude=pt["lat"], longitude=pt["lon"],
                wind_kt=pt["wind_kt"], pressure_hpa=pt["pressure_hpa"],
                intensity_class=pt["class"], source="IBTrACS", data_type="HISTORICAL",
            ))
        db.commit()
        logger.info("Seeded TAUKTAE track points")

    # ── AMPHAN track (Bay of Bengal, May 2020) ───────────────────────────────
    amphan_track = [
        {"timestamp": datetime(2020, 5, 13, 0), "lat": 9.5,  "lon": 85.5, "wind_kt": 30, "pressure_hpa": 1000, "class": "TD"},
        {"timestamp": datetime(2020, 5, 14, 0), "lat": 10.5, "lon": 85.0, "wind_kt": 45, "pressure_hpa": 992,  "class": "TS"},
        {"timestamp": datetime(2020, 5, 15, 0), "lat": 11.8, "lon": 85.5, "wind_kt": 65, "pressure_hpa": 976,  "class": "CAT1"},
        {"timestamp": datetime(2020, 5, 16, 0), "lat": 13.0, "lon": 86.0, "wind_kt": 90, "pressure_hpa": 958,  "class": "CAT2"},
        {"timestamp": datetime(2020, 5, 17, 0), "lat": 14.5, "lon": 86.5, "wind_kt": 120, "pressure_hpa": 934, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2020, 5, 18, 0), "lat": 16.0, "lon": 87.0, "wind_kt": 150, "pressure_hpa": 907, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2020, 5, 19, 0), "lat": 17.8, "lon": 87.5, "wind_kt": 140, "pressure_hpa": 912, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2020, 5, 20, 0), "lat": 19.8, "lon": 87.8, "wind_kt": 110, "pressure_hpa": 938, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2020, 5, 20, 12), "lat": 21.5, "lon": 88.0, "wind_kt": 85, "pressure_hpa": 958, "class": "CAT2"},
        {"timestamp": datetime(2020, 5, 21, 0), "lat": 23.0, "lon": 88.3, "wind_kt": 55, "pressure_hpa": 975, "class": "TS"},
    ]
    existing_pts = db.query(TrackPoint).filter_by(cyclone_id="2020_NI_AMPHAN").count()
    if existing_pts == 0:
        for pt in amphan_track:
            db.add(TrackPoint(
                cyclone_id="2020_NI_AMPHAN",
                timestamp=pt["timestamp"], latitude=pt["lat"], longitude=pt["lon"],
                wind_kt=pt["wind_kt"], pressure_hpa=pt["pressure_hpa"],
                intensity_class=pt["class"], source="IBTrACS", data_type="HISTORICAL",
            ))
        db.commit()
        logger.info("Seeded AMPHAN track points")

    # ── FANI track (Bay of Bengal, Apr–May 2019) ─────────────────────────────
    fani_track = [
        {"timestamp": datetime(2019, 4, 26, 0), "lat": 8.0,  "lon": 87.0, "wind_kt": 30, "pressure_hpa": 1000, "class": "TD"},
        {"timestamp": datetime(2019, 4, 27, 0), "lat": 8.8,  "lon": 86.5, "wind_kt": 45, "pressure_hpa": 992,  "class": "TS"},
        {"timestamp": datetime(2019, 4, 28, 0), "lat": 9.8,  "lon": 86.0, "wind_kt": 65, "pressure_hpa": 978,  "class": "CAT1"},
        {"timestamp": datetime(2019, 4, 29, 0), "lat": 11.0, "lon": 85.5, "wind_kt": 90, "pressure_hpa": 960,  "class": "CAT2"},
        {"timestamp": datetime(2019, 4, 30, 0), "lat": 12.5, "lon": 85.0, "wind_kt": 115, "pressure_hpa": 940, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2019, 5, 1, 0),  "lat": 14.0, "lon": 84.8, "wind_kt": 130, "pressure_hpa": 932, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2019, 5, 2, 0),  "lat": 15.8, "lon": 85.0, "wind_kt": 140, "pressure_hpa": 932, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2019, 5, 3, 0),  "lat": 17.5, "lon": 85.5, "wind_kt": 130, "pressure_hpa": 938, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2019, 5, 3, 12), "lat": 19.0, "lon": 85.8, "wind_kt": 105, "pressure_hpa": 950, "class": "CAT3_PLUS"},
        {"timestamp": datetime(2019, 5, 4, 0),  "lat": 20.5, "lon": 85.9, "wind_kt": 70,  "pressure_hpa": 970, "class": "CAT1"},
    ]
    existing_pts = db.query(TrackPoint).filter_by(cyclone_id="2019_NI_FANI").count()
    if existing_pts == 0:
        for pt in fani_track:
            db.add(TrackPoint(
                cyclone_id="2019_NI_FANI",
                timestamp=pt["timestamp"], latitude=pt["lat"], longitude=pt["lon"],
                wind_kt=pt["wind_kt"], pressure_hpa=pt["pressure_hpa"],
                intensity_class=pt["class"], source="IBTrACS", data_type="HISTORICAL",
            ))
        db.commit()
        logger.info("Seeded FANI track points")

    # ── GAJA track (Bay of Bengal, Nov 2018) ─────────────────────────────────
    gaja_track = [
        {"timestamp": datetime(2018, 11, 11, 0), "lat": 11.0, "lon": 89.0, "wind_kt": 30, "pressure_hpa": 1002, "class": "TD"},
        {"timestamp": datetime(2018, 11, 12, 0), "lat": 11.5, "lon": 87.5, "wind_kt": 45, "pressure_hpa": 994,  "class": "TS"},
        {"timestamp": datetime(2018, 11, 13, 0), "lat": 11.8, "lon": 86.0, "wind_kt": 60, "pressure_hpa": 982,  "class": "CAT1"},
        {"timestamp": datetime(2018, 11, 14, 0), "lat": 12.0, "lon": 84.5, "wind_kt": 75, "pressure_hpa": 978,  "class": "CAT1"},
        {"timestamp": datetime(2018, 11, 14, 12),"lat": 12.2, "lon": 83.0, "wind_kt": 70, "pressure_hpa": 980,  "class": "CAT1"},
        {"timestamp": datetime(2018, 11, 15, 0), "lat": 12.5, "lon": 81.5, "wind_kt": 60, "pressure_hpa": 988,  "class": "CAT1"},
        {"timestamp": datetime(2018, 11, 15, 12),"lat": 12.8, "lon": 80.5, "wind_kt": 45, "pressure_hpa": 994,  "class": "TS"},
        {"timestamp": datetime(2018, 11, 16, 0), "lat": 13.0, "lon": 79.8, "wind_kt": 30, "pressure_hpa": 1000, "class": "TD"},
    ]
    existing_pts = db.query(TrackPoint).filter_by(cyclone_id="2018_NI_GAJA").count()
    if existing_pts == 0:
        for pt in gaja_track:
            db.add(TrackPoint(
                cyclone_id="2018_NI_GAJA",
                timestamp=pt["timestamp"], latitude=pt["lat"], longitude=pt["lon"],
                wind_kt=pt["wind_kt"], pressure_hpa=pt["pressure_hpa"],
                intensity_class=pt["class"], source="IBTrACS", data_type="HISTORICAL",
            ))
        db.commit()
        logger.info("Seeded GAJA track points")


def init_database() -> None:
    """Full database initialization."""
    create_tables()
    db = SessionLocal()
    try:
        seed_ml_models(db)
        seed_sample_cyclones(db)
        logger.info("Database initialization complete.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_database()
    print("✅ Database initialized successfully")
