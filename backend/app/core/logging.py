import logging
import sys
from pathlib import Path

try:
    from loguru import logger
    LOGURU_AVAILABLE = True
except ImportError:
    logger = logging.getLogger("cyclone")
    LOGURU_AVAILABLE = False

from app.core.config import settings


def setup_logging() -> None:
    """Configure application logging."""
    if not LOGURU_AVAILABLE:
        logging.basicConfig(
            level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
            format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        )
        logging.info("Logging initialized (standard library fallback)")
        return

    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )

    log_path = Path(settings.LOG_FILE)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger.add(
        str(log_path),
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        backtrace=False,
        diagnose=False,
    )

    class InterceptHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            level = logger.level(record.levelname).name
            frame, depth = sys._getframe(6), 6
            while frame and frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1
            logger.opt(depth=depth, exception=record.exc_info).log(
                level, record.getMessage()
            )

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    for name in ["uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy"]:
        logging.getLogger(name).handlers = [InterceptHandler()]

    logger.info(f"Logging initialized — level={settings.LOG_LEVEL}")


def get_logger(name: str):
    """Get a named logger instance."""
    if LOGURU_AVAILABLE:
        return logger.bind(name=name)
    return logging.getLogger(name)
