"""
API Tests
=========
Basic integration tests for all API endpoints.
Uses SQLite in-memory database for isolation.
"""

import io
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client with in-memory database."""
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parents[1]))

    # Override database URL for testing
    import os
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

    from app.main import app
    from app.database.connection import Base, engine
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as c:
        yield c

    # Cleanup
    Base.metadata.drop_all(bind=engine)
    if Path("./test.db").exists():
        Path("./test.db").unlink()


class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "version" in data
        assert "models" in data
        assert "database" in data

    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data


class TestModels:
    def test_list_models(self, client):
        resp = client.get("/api/v1/models")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)


class TestCyclones:
    def test_list_cyclones(self, client):
        resp = client.get("/api/v1/cyclones")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "cyclones" in data["data"]
        assert "total" in data["data"]

    def test_list_cyclones_filter_basin(self, client):
        resp = client.get("/api/v1/cyclones?basin=NI")
        assert resp.status_code == 200

    def test_list_cyclones_invalid_basin(self, client):
        resp = client.get("/api/v1/cyclones?basin=INVALID")
        assert resp.status_code == 400

    def test_get_cyclone_not_found(self, client):
        resp = client.get("/api/v1/cyclones/NONEXISTENT_ID")
        assert resp.status_code == 404
        data = resp.json()
        assert data["detail"]["code"] == "CYCLONE_NOT_FOUND"

    def test_get_cyclone_valid(self, client):
        resp = client.get("/api/v1/cyclones/2023_NI_BIPARJOY")
        # Either 200 (if seeded) or 404 (if DB not seeded)
        assert resp.status_code in (200, 404)


class TestDetection:
    def test_detect_valid_image(self, client):
        """Test detection with a valid PNG image."""
        import numpy as np
        from PIL import Image

        img = Image.fromarray(
            (np.random.rand(224, 224) * 255).astype("uint8"), mode="L"
        )
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        resp = client.post(
            "/api/v1/detection/predict",
            files={"file": ("test.png", buf, "image/png")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_detect_invalid_format(self, client):
        """Test detection with invalid file format."""
        resp = client.post(
            "/api/v1/detection/predict",
            files={"file": ("test.pdf", b"fake content", "application/pdf")},
        )
        assert resp.status_code == 400


class TestIntensityPrediction:
    def test_predict_intensity_valid(self, client):
        resp = client.post(
            "/api/v1/intensity/predict",
            json={
                "history": [
                    {"lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998},
                    {"lat": 12.8, "lon": 65.8, "wind_kt": 55, "pressure_hpa": 990},
                    {"lat": 13.6, "lon": 66.5, "wind_kt": 65, "pressure_hpa": 982},
                ]
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_predict_intensity_insufficient_history(self, client):
        resp = client.post(
            "/api/v1/intensity/predict",
            json={"history": [{"lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998}]},
        )
        assert resp.status_code == 422

    def test_predict_intensity_invalid_coords(self, client):
        resp = client.post(
            "/api/v1/intensity/predict",
            json={
                "history": [
                    {"lat": 999, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998},
                    {"lat": 12.8, "lon": 65.8, "wind_kt": 55, "pressure_hpa": 990},
                ]
            },
        )
        assert resp.status_code == 422


class TestTrackPrediction:
    def test_predict_track_valid(self, client):
        resp = client.post(
            "/api/v1/track/predict",
            json={
                "history": [
                    {"lat": 12.0 + i * 0.4, "lon": 65.0 + i * 0.5, "wind_kt": 45 + i * 5, "pressure_hpa": 998 - i * 3}
                    for i in range(4)
                ],
                "prediction_horizon_hours": 24,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_predict_track_insufficient(self, client):
        resp = client.post(
            "/api/v1/track/predict",
            json={"history": [{"lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998}]},
        )
        assert resp.status_code == 422


class TestSatellite:
    def test_list_observations(self, client):
        resp = client.get("/api/v1/satellite")
        assert resp.status_code == 200

    def test_upload_satellite_image(self, client):
        import numpy as np
        from PIL import Image

        img = Image.fromarray((np.random.rand(224, 224) * 255).astype("uint8"), mode="L")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        resp = client.post(
            "/api/v1/satellite/upload",
            files={"file": ("satellite.png", buf, "image/png")},
            data={"satellite": "HURSAT", "channel": "IR", "latitude": "14.5", "longitude": "67.2"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "observation_id" in data["data"]
