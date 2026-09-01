"""
Application Configuration
==========================
All settings loaded from environment variables (.env file).
Never hard-code secrets here.
"""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Look for .env in backend dir or project root
_env_files = []
_backend_env = Path(__file__).parents[3] / ".env"       # project root .env
_local_env   = Path(__file__).parents[2] / ".env"       # backend/.env
for p in [_local_env, _backend_env]:
    if p.exists():
        _env_files.append(str(p))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files or ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "Tropical Cyclone AI Platform"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-in-production-use-a-long-random-string"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://cyclone_user:cyclone_pass@localhost:5432/cyclone_db"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # ── Backend ───────────────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    ALLOWED_IMAGE_FORMATS: str = "png,jpg,jpeg,tif,tiff,nc,hdf5,h5"

    @property
    def allowed_origins_list(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_formats_list(self) -> list:
        return [f.strip() for f in self.ALLOWED_IMAGE_FORMATS.split(",") if f.strip()]

    # ── ML Models ────────────────────────────────────────────────────────────
    MODEL_BASE_PATH: str = "./models"
    DETECTION_MODEL_PATH: Optional[str] = None
    CLASSIFICATION_MODEL_PATH: Optional[str] = None
    INTENSITY_MODEL_PATH: Optional[str] = None
    TRACK_MODEL_PATH: Optional[str] = None
    INFERENCE_DEVICE: str = "cpu"
    MODEL_CACHE_ENABLED: bool = True

    # ── File Upload ───────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./data/uploads"

    # ── Data Paths ────────────────────────────────────────────────────────────
    DATA_BASE_PATH: str = "./data"
    RAW_DATA_PATH: str = "./data/raw"
    PROCESSED_DATA_PATH: str = "./data/processed"

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: Optional[str] = None

    # ── Pagination ────────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def detection_model_full_path(self) -> Optional[str]:
        if self.DETECTION_MODEL_PATH:
            return self.DETECTION_MODEL_PATH
        p = Path(self.MODEL_BASE_PATH) / "detection-v1" / "model.pth"
        return str(p) if p.exists() else None

    @property
    def classification_model_full_path(self) -> Optional[str]:
        if self.CLASSIFICATION_MODEL_PATH:
            return self.CLASSIFICATION_MODEL_PATH
        p = Path(self.MODEL_BASE_PATH) / "classification-v1" / "model.pth"
        return str(p) if p.exists() else None

    @property
    def intensity_model_full_path(self) -> Optional[str]:
        if self.INTENSITY_MODEL_PATH:
            return self.INTENSITY_MODEL_PATH
        p = Path(self.MODEL_BASE_PATH) / "intensity-v1" / "model.pth"
        return str(p) if p.exists() else None

    @property
    def track_model_full_path(self) -> Optional[str]:
        if self.TRACK_MODEL_PATH:
            return self.TRACK_MODEL_PATH
        p = Path(self.MODEL_BASE_PATH) / "track-v1" / "model.pth"
        return str(p) if p.exists() else None


# Global settings instance
settings = Settings()
