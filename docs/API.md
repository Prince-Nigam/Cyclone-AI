# 📡 API Documentation

> Tropical Cyclone AI Platform — REST API Reference
> Base URL: `http://localhost:8000`

---

## Authentication

Currently open API (no authentication required for prototype).
In production, Bearer token authentication will be added.

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Data Type Labels

All predictions include a `data_type` field:
- `OBSERVED` — actual sensor data
- `HISTORICAL` — archived best-track records
- `SIMULATED` — generated for demonstration
- `PREDICTED` — AI/ML model output

---

## Endpoints

### Health Check

#### `GET /health`

Returns system health status.

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "detection": "loaded",
    "classification": "loaded",
    "intensity": "loaded",
    "track": "loaded"
  },
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### Models

#### `GET /api/v1/models`

Returns information about available ML models.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "detection",
      "version": "v1",
      "architecture": "efficientnet_b0",
      "status": "loaded",
      "trained_on": "HURSAT-B1 + IBTrACS",
      "metrics": {
        "accuracy": null,
        "f1": null
      },
      "note": "Metrics updated after evaluation on test set"
    }
  ]
}
```

---

### Detection

#### `POST /api/v1/detection/predict`

Detect cyclone in a satellite image.

**Request**: `multipart/form-data`
- `file` (required): Satellite image file (PNG, JPG, TIFF, NetCDF)
- `satellite_source` (optional): Source identifier (default: "unknown")

**Response**:
```json
{
  "success": true,
  "data": {
    "detected": true,
    "confidence": 0.87,
    "model_version": "detection-v1",
    "data_type": "PREDICTED",
    "inference_time_ms": 450,
    "disclaimer": "This is a model prediction, not an official weather observation."
  }
}
```

**Errors**:
```json
{ "success": false, "error": "Invalid image format. Supported: PNG, JPG, TIFF", "code": "INVALID_FORMAT" }
{ "success": false, "error": "Image too large. Max size: 50MB", "code": "FILE_TOO_LARGE" }
{ "success": false, "error": "Model not loaded", "code": "MODEL_UNAVAILABLE" }
```

---

### Classification

#### `POST /api/v1/classification/predict`

Classify cyclone intensity pattern.

**Request**: `multipart/form-data`
- `file` (required): Satellite image file

**Response**:
```json
{
  "success": true,
  "data": {
    "pattern": "CAT2",
    "pattern_label": "Category 2 Hurricane",
    "wind_range_kt": "83-95",
    "confidence": 0.74,
    "probabilities": {
      "TD": 0.02,
      "TS": 0.05,
      "CAT1": 0.12,
      "CAT2": 0.74,
      "CAT3_PLUS": 0.07
    },
    "model_version": "classification-v1",
    "data_type": "PREDICTED",
    "disclaimer": "Classification based on IR satellite appearance only."
  }
}
```

---

### Intensity Prediction

#### `POST /api/v1/intensity/predict`

Predict cyclone intensity (wind speed, pressure).

**Request**: `application/json`
```json
{
  "cyclone_id": "2023_NI_BIPARJOY",
  "current_lat": 14.5,
  "current_lon": 67.2,
  "history": [
    { "timestamp": "2023-06-10T00:00:00Z", "lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998 },
    { "timestamp": "2023-06-10T06:00:00Z", "lat": 12.8, "lon": 65.8, "wind_kt": 55, "pressure_hpa": 990 },
    { "timestamp": "2023-06-10T12:00:00Z", "lat": 13.6, "lon": 66.5, "wind_kt": 65, "pressure_hpa": 982 }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "predicted_wind_kt": 72.4,
    "predicted_pressure_hpa": 978.1,
    "intensity_class": "CAT1",
    "model_version": "intensity-v1",
    "data_type": "PREDICTED",
    "disclaimer": "Intensity prediction is a model estimate. Actual intensity may differ significantly.",
    "insufficient_history": false
  }
}
```

**Error** (insufficient data):
```json
{
  "success": false,
  "error": "Insufficient historical observations for intensity prediction. Minimum 3 required.",
  "code": "INSUFFICIENT_DATA"
}
```

---

### Track Prediction

#### `POST /api/v1/track/predict`

Predict future cyclone track.

**Request**: `application/json`
```json
{
  "cyclone_id": "2023_NI_BIPARJOY",
  "history": [
    { "timestamp": "2023-06-10T00:00:00Z", "lat": 12.0, "lon": 65.0, "wind_kt": 45, "pressure_hpa": 998 },
    { "timestamp": "2023-06-10T03:00:00Z", "lat": 12.4, "lon": 65.4, "wind_kt": 50, "pressure_hpa": 995 },
    { "timestamp": "2023-06-10T06:00:00Z", "lat": 12.8, "lon": 65.8, "wind_kt": 55, "pressure_hpa": 990 },
    { "timestamp": "2023-06-10T09:00:00Z", "lat": 13.2, "lon": 66.2, "wind_kt": 60, "pressure_hpa": 986 }
  ],
  "prediction_horizon_hours": 24
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "predicted_track": [
      { "step": 1, "hours_ahead": 3, "lat": 13.8, "lon": 66.7 },
      { "step": 2, "hours_ahead": 6, "lat": 14.3, "lon": 67.1 },
      { "step": 3, "hours_ahead": 9, "lat": 14.9, "lon": 67.4 },
      { "step": 4, "hours_ahead": 12, "lat": 15.5, "lon": 67.6 },
      { "step": 5, "hours_ahead": 15, "lat": 16.2, "lon": 67.8 },
      { "step": 6, "hours_ahead": 18, "lat": 16.9, "lon": 68.0 },
      { "step": 7, "hours_ahead": 21, "lat": 17.6, "lon": 68.1 },
      { "step": 8, "hours_ahead": 24, "lat": 18.4, "lon": 68.2 }
    ],
    "model_version": "track-v1",
    "data_type": "PREDICTED",
    "uncertainty_note": "Track uncertainty increases with prediction horizon.",
    "disclaimer": "Track prediction is a model estimate. Do not use for navigation or emergency decisions."
  }
}
```

---

### Unified Analysis

#### `POST /api/v1/analyze`

Run complete analysis pipeline on a satellite image.

**Request**: `multipart/form-data`
- `file` (required): Satellite image
- `cyclone_history` (optional): JSON string with historical track data

**Response**:
```json
{
  "success": true,
  "data": {
    "detection": {
      "detected": true,
      "confidence": 0.87,
      "model_version": "detection-v1"
    },
    "classification": {
      "pattern": "CAT2",
      "confidence": 0.74,
      "probabilities": {}
    },
    "intensity": {
      "predicted_wind_kt": 72.4,
      "predicted_pressure_hpa": 978.1,
      "available": true
    },
    "track": {
      "predicted_track": [],
      "available": false,
      "reason": "No historical track data provided"
    },
    "explainability": {
      "heatmap_base64": "data:image/png;base64,...",
      "method": "Grad-CAM",
      "disclaimer": "Heatmap shows model attention regions, not meteorological proof."
    },
    "metadata": {
      "analysis_id": "uuid",
      "model_version": "v1",
      "data_type": "PREDICTED",
      "inference_time_ms": 850,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### Cyclones

#### `GET /api/v1/cyclones`

List historical cyclones from database.

**Query Parameters**:
- `basin` (optional): Ocean basin code (NI, EP, NA, WP, SP, SI)
- `year` (optional): Filter by year
- `intensity` (optional): Filter by class (TD, TS, CAT1, CAT2, CAT3_PLUS)
- `name` (optional): Search by name (partial match)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "cyclones": [
      {
        "id": "2023_NI_BIPARJOY",
        "name": "BIPARJOY",
        "basin": "NI",
        "start_time": "2023-06-06T00:00:00Z",
        "end_time": "2023-06-19T00:00:00Z",
        "peak_intensity": "CAT3_PLUS",
        "peak_wind_kt": 115,
        "peak_pressure_hpa": 944,
        "source": "IBTrACS",
        "data_type": "HISTORICAL"
      }
    ],
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

---

#### `GET /api/v1/cyclones/{cyclone_id}`

Get detailed information about a specific cyclone.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "2023_NI_BIPARJOY",
    "name": "BIPARJOY",
    "basin": "NI",
    "track": [
      {
        "timestamp": "2023-06-06T00:00:00Z",
        "lat": 11.2,
        "lon": 67.4,
        "wind_kt": 25,
        "pressure_hpa": 1004,
        "intensity_class": "TD"
      }
    ],
    "observations": [],
    "predictions": [],
    "data_type": "HISTORICAL",
    "source": "IBTrACS v04"
  }
}
```

---

### Satellite

#### `GET /api/v1/satellite`

List available satellite observations.

**Query Parameters**:
- `cyclone_id` (optional)
- `satellite` (optional)
- `start_time` / `end_time` (optional)
- `page`, `limit`

---

#### `POST /api/v1/satellite/upload`

Upload a satellite image for analysis.

**Request**: `multipart/form-data`
- `file`: Image file
- `satellite`: Satellite name
- `timestamp`: Observation time (ISO 8601)
- `latitude`: Center latitude
- `longitude`: Center longitude
- `channel`: Channel name (IR, VIS, WV, etc.)

**Response**:
```json
{
  "success": true,
  "data": {
    "observation_id": "uuid",
    "file_path": "/data/uploads/uuid.png",
    "status": "uploaded",
    "ready_for_analysis": true
  }
}
```

---

### Predictions

#### `GET /api/v1/predictions/{prediction_id}`

Get stored prediction by ID.

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_FORMAT` | Unsupported file format |
| `FILE_TOO_LARGE` | File exceeds size limit |
| `MODEL_UNAVAILABLE` | ML model not loaded |
| `INSUFFICIENT_DATA` | Not enough history for prediction |
| `INVALID_COORDINATES` | Lat/lon out of valid range |
| `INVALID_TIMESTAMP` | Timestamp format invalid |
| `CYCLONE_NOT_FOUND` | Cyclone ID not in database |
| `PREDICTION_FAILED` | Model inference error |
| `DATABASE_ERROR` | Database connection issue |
| `VALIDATION_ERROR` | Request validation failed |

---

*Full interactive API docs available at `/docs` when server is running.*
*Last updated: 2024*
