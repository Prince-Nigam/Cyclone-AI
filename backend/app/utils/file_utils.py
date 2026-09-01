"""
File Utilities
==============
Upload validation and storage helpers.
"""

import os
import uuid
from pathlib import Path
from typing import Dict

import aiofiles
from fastapi import UploadFile

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".tif", ".tiff",
    ".nc", ".h5", ".hdf5", ".hdf",
}


async def validate_upload(file: UploadFile, max_size_mb: int = 50) -> Dict:
    """
    Validate an uploaded file.

    Returns:
        dict with 'valid': bool and 'error': str if invalid.
    """
    if not file.filename:
        return {"valid": False, "error": "No filename provided"}

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "valid": False,
            "error": f"Unsupported file format: '{ext}'. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        }

    # Check content type
    content_type = file.content_type or ""
    if content_type and content_type.startswith("text/") and ext not in (".nc",):
        return {"valid": False, "error": f"Unexpected content type: {content_type}"}

    return {"valid": True}


async def save_upload(
    file: UploadFile,
    upload_dir: str,
    permanent: bool = False,
) -> str:
    """
    Save an uploaded file to disk.

    Args:
        file: FastAPI UploadFile.
        upload_dir: Directory to save the file.
        permanent: If False, uses a temp filename that can be cleaned up.

    Returns:
        Absolute path to saved file.
    """
    upload_path = Path(upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix.lower() if file.filename else ".bin"
    filename = f"{'perm' if permanent else 'tmp'}_{uuid.uuid4().hex}{ext}"
    file_path = upload_path / filename

    await file.seek(0)
    async with aiofiles.open(str(file_path), "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            await f.write(chunk)

    return str(file_path)


def cleanup_temp_files(upload_dir: str, max_age_hours: int = 1) -> int:
    """
    Remove temporary upload files older than max_age_hours.
    Returns count of deleted files.
    """
    import time
    count = 0
    cutoff = time.time() - (max_age_hours * 3600)
    upload_path = Path(upload_dir)

    if not upload_path.exists():
        return 0

    for f in upload_path.glob("tmp_*"):
        if f.stat().st_mtime < cutoff:
            try:
                f.unlink()
                count += 1
            except Exception:
                pass

    return count
