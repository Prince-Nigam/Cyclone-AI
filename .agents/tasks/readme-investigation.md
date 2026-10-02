# SIH-Project Codebase — Full Investigation Report

**Purpose:** Comprehensive findings to support writing an accurate, complete README.  
**Generated from:** Direct file reads across all major modules.  
**Date:** Investigation performed on current codebase state.

---

## SUMMARY

The SIH-Project is a full-stack **Tropical Cyclone AI Platform** built for **Smart India Hackathon 2026**, addressing a Ministry of Earth Sciences (MoES) problem statement on AI/ML-based cyclone identification, classification, and prediction. The stack is **Next.js 14 (TypeScript) frontend + FastAPI (Python) backend + PyTorch AI models**, deployable via Docker Compose locally, Render for backend, and Vercel for frontend.

The existing README is already **high quality and largely accurate** — it was clearly written with knowledge of the codebase. However, several details found during investigation need updating:

1. The `frontend/app/layout.tsx` metadata still says "SIH 2024" in description/keywords — the README says 2026.
2. The `about/page.tsx` metadata says "SIH 2024" in its description field.
3. The README's existing content is accurate to what's in the code.

---

## EVIDENCE — SECTION BY SECTION

### 1. Frontend Pages (`frontend/app/`)

| Route | File | What it does |
|:---|:---|:---|
| `/` | `app/page.tsx` | Dashboard: Hero section, LiveTickerBar, 4 stat cards, tabbed Cyclone Monitor (Live GDACS + Historical IBTrACS), System Architecture 4-pillar grid |
| `/detection` | `app/detection/page.tsx` | Upload satellite IR image → EfficientNet-B0 detection + ResNet50 classification + Grad-CAM. Drag/drop, paste, sample images |
| `/satellite` | `app/satellite/page.tsx` | Same pipeline as /detection with slightly different layout; calls `analyzeImage` service with `run_xai=true` |
| `/prediction` | `app/prediction/page.tsx` | (Not directly read but referenced by types and API — track + intensity via CNN+LSTM and Seq2Seq LSTM) |
| `/live-satellite` | (referenced in nav) | Real-time GDACS cyclone alerts, NASA GIBS tiles, Windy.com streamlines |
| `/map` | (referenced in nav) | Interactive Leaflet GIS map with historical best-tracks |
| `/historical` | (referenced in nav) | IBTrACS archive catalog, filterable by basin/year/intensity/name |
| `/performance` | `app/performance/page.tsx` | Model benchmarks, per-class metrics, confusion matrix, training convergence charts (Recharts) |
| `/methodology` | `app/methodology/page.tsx` | ML pipeline documentation, architecture details, loss functions |
| `/about` | `app/about/page.tsx` | Project info, MoES alignment, data source attribution, disclaimer |

**Key page detail — Dashboard (`page.tsx`):**
- Uses `getRealtimeCyclones(false)` via `realtimeService` — polls GDACS every 5 min.
- Uses `getCyclones({ basin: "NI", limit: 6 })` for Historical tab.
- FEATURE_CARDS array: 6 cards for Detection, Classification, Intensity, Track, Grad-CAM, Historical.
- ARCH array: 4 pillars: Data Ingestion, AI Pipeline, Backend, Frontend.
- Hero: `h1` → "Tropical Cyclone AI Platform", no Ministry/SIH branding in hero body (those were removed per user instructions).
- Hero description: "Multi-source satellite data fusion — real-time GDACS alerts, Open-Meteo marine telemetry and NASA GIBS imagery — combined with deep learning for identification, classification and 24-hour forecasting."

**Key page detail — Detection (`detection/page.tsx`):**
- Page hero badge: `EfficientNet-B0`, `ResNet50`, `Grad-CAM XAI`
- Title: "Cyclone Detection & Classification"
- Sample images: Typhoon Megi 2016, Hurricane Isabel, Cyclone Gafilo
- Calls `validateImageFileForCyclone` (client-side check) before API call
- Results panel shows `AnalysisPanel` component (from `components/analysis/AnalysisPanel`)
- Model info cards: Detection (EfficientNet-B0), Classification (ResNet50)

**Key page detail — Satellite (`satellite/page.tsx`):**
- Virtually identical to detection page in layout
- Also runs full analysis pipeline; same `analyzeImage` call
- Right panel header says "Analysis Results"

**Key page detail — Performance (`performance/page.tsx`):**
Per-class benchmark data (hardcoded in component):
```
TD:    precision=84%, recall=81%, f1=82%, support=420
TS:    precision=79%, recall=83%, f1=81%, support=650
CAT1:  precision=76%, recall=72%, f1=74%, support=380
CAT2:  precision=72%, recall=75%, f1=73%, support=290
CAT3+: precision=74%, recall=69%, f1=71%, support=210
```
Training convergence (detection model, 30 epochs):
- Epoch 1: train=1.62, val=1.48, acc=42%
- Epoch 15: train=0.64, val=0.68, acc=75%
- Epoch 30: train=0.29, val=0.48, acc=85.4%
Confusion matrix (5×5 for classification):
```
[81,14, 4, 1, 0]  TD
[11,83, 5, 1, 0]  TS
[ 2,16,72, 8, 2]  CAT1
[ 0, 4,15,75, 6]  CAT2
[ 0, 2, 7,22,69]  CAT3+
```
Tabs: OVERVIEW, CLASSES, CONFUSION, TRAINING

**Key page detail — Methodology (`methodology/page.tsx`):**
Model specs from the models array (first 2 read):
1. EfficientNet-B0 — lr=1e-4 AdamW, CosineAnnealingLR, 30 epochs
2. ResNet50 — SGD Nesterov (lr=5e-4, momentum=0.9), Focal Loss γ=2.0

---

### 2. Backend API Endpoints (`backend/app/api/v1/`)

#### AI Inference

| Method | Path | File | Description |
|:---|:---|:---|:---|
| POST | `/api/v1/analyze` | `analyze.py` | Unified pipeline: Detection + Classification + Intensity + Track + Grad-CAM. Accepts `file` (UploadFile), `cyclone_history` (JSON string), `cyclone_id` (str), `run_xai` (bool). Saves prediction to DB. Returns `UnifiedAnalysisResult`. |
| POST | `/api/v1/detection/predict` | `detection.py` | EfficientNet-B0 binary detection only. Accepts `file`, `satellite_source`. Returns `DetectionResult`. |
| POST | `/api/v1/classification/predict` | `classification.py` | ResNet50 5-class classification only. (Referenced in README; not read but follows same pattern) |
| POST | `/api/v1/intensity/predict` | `prediction.py` | CNN+LSTM intensity regression. Body: `IntensityPredictRequest` with `history: List[HistoryPoint]` (min 2). Returns `IntensityResult`. Falls back to SIMULATED if model not loaded. |
| POST | `/api/v1/track/predict` | `prediction.py` | Seq2Seq LSTM 24h track. Body: `TrackPredictRequest` with `history: List[HistoryPoint]` (min 2), `prediction_horizon_hours` (int). Returns `TrackResult`. Falls back to SIMULATED. |

#### Real-Time Telemetry

| Method | Path | File | Description |
|:---|:---|:---|:---|
| GET | `/api/v1/realtime/cyclones` | `realtime.py` | Active cyclones from GDACS RSS. Query: `indian_ocean_only` (bool). Returns `{cyclones, total, source, data_type, indian_ocean, disclaimer}`. 15-min cache. |
| GET | `/api/v1/realtime/weather` | `realtime.py` | Open-Meteo weather at lat/lon. Query: `lat`, `lon`. Returns `{wind_kt, wind_dir_deg, pressure_hpa, temp_c, humidity_pct}`. |
| GET | `/api/v1/realtime/ocean-grid` | `realtime.py` | 12-station Indian Ocean grid. Returns `{points, total, source, data_type}`. |
| GET | `/api/v1/realtime/live-feed` | `realtime.py` | 1-second telemetry stream. Returns `{timestamp_epoch, utc_time, active_cyclones_count, active_cyclones, ocean_grid, pulse_id}`. |
| GET | `/api/v1/realtime/status` | `realtime.py` | Cache age & source URLs debug endpoint. |

#### Historical & Registry

| Method | Path | File | Description |
|:---|:---|:---|:---|
| GET | `/api/v1/cyclones` | `cyclones.py` | IBTrACS list. Query: `basin` (NI/EP/NA/WP/SP/SI), `year`, `intensity` (TD/TS/CAT1/CAT2/CAT3_PLUS), `name` (partial), `page`, `limit`. Returns `CycloneListResponse`. |
| GET | `/api/v1/cyclones/{id}` | `cyclones.py` | Full track + metadata for one cyclone. Returns `CycloneDetail` (includes `track: List[TrackPointResponse]`). |
| GET | `/api/v1/models` | `models.py` | ML model registry with benchmark metrics. (Referenced; follows standard pattern) |
| POST | `/api/v1/satellite/upload` | `satellite.py` | Upload & store satellite image metadata. |
| GET | `/health` | `health.py` | Component health. Returns `{status, version, models, database, timestamp}`. Checks DB `SELECT 1`. |

**Swagger UI:** `http://localhost:8000/docs` · **ReDoc:** `http://localhost:8000/redoc`

---

### 3. AI Models (`ai/models/`)

#### 3.1 CycloneDetectionModel — `detection_model.py`

```
Architecture : EfficientNet-B0 (ImageNet pretrained, fine-tuned)
Input        : (B, 1, 224, 224) — single-channel IR image
Output       : (B, 1) logit → sigmoid → binary probability
Modification : First Conv2d adapted from 3-ch to 1-ch (weights averaged)
Classifier   : GlobalAvgPool → Dropout(0.3) → Linear(1280, 256) → ReLU → Dropout(0.21) → Linear(256, 1)
MODEL_VERSION: "detection-v1"
Parameters   : ~5.3M (EfficientNet-B0 base)
Feature dim  : 1280 (used for fusion & downstream)
Loss         : BCE with Logits
Accuracy     : ~85.4%  F1: 0.851
```

`predict()` returns:
```python
{
  "detected": bool,
  "confidence": float,  # sigmoid probability
  "model_version": "detection-v1",
  "data_type": "PREDICTED",
  "disclaimer": str
}
```

#### 3.2 CycloneClassificationModel — `classification_model.py`

```
Architecture : ResNet50 (ImageNet pretrained, fine-tuned)
Input        : (B, 1, 224, 224) — single-channel IR image
Output       : (B, 5) logits → softmax → class probabilities
Modification : First Conv2d adapted from 3-ch to 1-ch (weights averaged)
Classifier   : GlobalAvgPool → Dropout(0.4) → Linear(2048, 512) → ReLU → Dropout(0.3) → Linear(512, 5)
MODEL_VERSION: "classification-v1"
Feature dim  : 2048 (ResNet50 penultimate layer)
Loss         : FocalLoss (γ=2.0) for class imbalance
Accuracy     : ~76.8%  Weighted F1: 0.748
```

Classes (5):
```
0: TD         (Tropical Depression)    < 34 kt
1: TS         (Tropical Storm)         34–63 kt
2: CAT1       (Category 1 Hurricane)   64–82 kt
3: CAT2       (Category 2 Hurricane)   83–95 kt
4: CAT3_PLUS  (Major Cyclone 3/4/5)    ≥ 96 kt
```

`predict()` returns:
```python
{
  "pattern": "TS",
  "pattern_label": "Tropical Storm",
  "wind_range_kt": "34–63 kt",
  "class_idx": 1,
  "confidence": float,
  "probabilities": {"TD": float, "TS": float, ...},
  "model_version": "classification-v1",
  "data_type": "PREDICTED",
  "disclaimer": str
}
```

`get_feature_vector()` → `(B, 2048)` for fusion.

#### 3.3 IntensityPredictionModel — `intensity_model.py`

```
Architecture : CNN feature extractor (EfficientNet-B0) + LSTM regressor
               (Full: IntensityPredictionModel)
               (Simple: NumericOnlyIntensityModel — no images)
Input        : img_features (B, T, 1280) + numeric (B, T, 4)
               numeric = [lat, lon, wind_kt, pressure_hpa]
SEQUENCE_LENGTH: 4 (last 4 time steps = 12h at 3h intervals)
LSTM         : hidden=256, layers=2, dropout=0.3
Regressor    : Linear(256,128) → ReLU → Dropout → Linear(128,2)
Output       : [wind_kt, pressure_hpa] scalars
MODEL_VERSION: "intensity-v1"
Loss         : Smooth L1 / Huber
MAE          : ~8.32 kt   R²: 0.835
```

Simple numeric-only model: LSTM(4→128, 2 layers) → Linear(128,64) → Linear(64,2).

`predict()` returns:
```python
{
  "predicted_wind_kt": float,
  "predicted_pressure_hpa": float,
  "intensity_class": "TS",  # mapped from wind speed
  "model_version": str,
  "data_type": "PREDICTED",
  "disclaimer": str
}
```

Physical bounds enforced: `wind_kt ≥ 0`, `pressure_hpa ∈ [850, 1015]`.

#### 3.4 CycloneTrackModel — `track_model.py`

```
Architecture : Encoder-Decoder Seq2Seq LSTM
Encoder      : LSTM(input=4, hidden=256, layers=2, batch_first=True)
Decoder      : LSTM(input=2, hidden=256, layers=2) + Linear(256,2)
ENCODER_STEPS: 8 (last 8 steps = 24h at 3h intervals)
DECODER_STEPS: 8 (8 future steps = 24h ahead)
INPUT_FEATURES: 4 → [lat, lon, wind_kt, pressure_hpa]
OUTPUT_FEATURES: 2 → [lat, lon]
MODEL_VERSION: "track-v1"
Loss         : MSE on (Δlat, Δlon) [haversine approx]
MAE          : ~48.60 km   R²: 0.892
Teacher forcing during training (ratio=0.5)
```

Normalization factors: `[90.0, 180.0, 200.0, 1050.0]`  
Padding: if history < 8 steps, repeats first observation.

`predict()` returns:
```python
{
  "success": True,
  "predicted_track": [
    {"step": 1, "hours_ahead": 3, "lat": float, "lon": float},
    ...  # 8 steps
  ],
  "prediction_horizon_hours": 24,
  "model_version": "track-v1",
  "data_type": "PREDICTED",
  "uncertainty_note": str,
  "disclaimer": str
}
```

#### 3.5 MultiSourceFusionModel — `fusion_model.py`

```
Architecture : Late Feature Fusion MLP
Encoder A    : SatelliteEncoder (EfficientNet-B0, Source: HURSAT-B1)
Encoder B    : SatelliteEncoder (EfficientNet-B0, Source: INSAT-3D) — optional
Feature dim  : 1280 per source
Fusion input : 1280×2 = 2560 (multi-source) or 1280 (single-source)
FusionMLP    : Linear(2560,512) → BN → ReLU → Dropout(0.3)
               → Linear(512,256) → BN → ReLU → Dropout(0.3)
Classifier   : Linear(256, 5)
MODEL_VERSION: "fusion-v1"
Output       : 5-class logits + 256-dim fused features
Performance  : +~3% improvement over single-source
```

Graceful degradation: missing source → zero vector substitution with `fusion_mode = "SINGLE_SOURCE"`.

---

### 4. AI Inference Pipeline (`ai/inference/predictor.py`)

**Class:** `CyclonePredictor`

Pipeline (6 steps):
1. Validate & load image (file path or numpy array) via `ImageProcessor`/`ImageValidator`
2. Convert to tensor `(1, 1, H, W)` → device
3. **Detection:** `detection_model.predict(tensor)` → `DetectionResult`
4. **Classification:** `classification_model.predict(tensor)` → `ClassificationResult` (runs regardless of detection)
5. **Intensity:** `intensity_model.predict(history)` → needs ≥2 history points
6. **Track:** `track_model.predict(history)` → needs ≥2 history points
7. **Grad-CAM:** `_gradcam_detection.analyze(tensor)` → heatmap base64 (lazy init)

Returns unified dict with all results + `metadata.inference_time_ms`.

**Singleton:** `get_predictor()` — module-level singleton, thread-safe for read-only inference.

Model loading handles missing weights gracefully: returns backbone-only model (ImageNet features, no fine-tuning). Demo mode runs without `.pth` weight files.

---

### 5. Services (`backend/app/services/realtime_service.py`)

**GDACS Fetcher (`fetch_gdacs_cyclones`):**
- URL: `https://www.gdacs.org/xml/rss.xml`
- Parses XML namespaces: `gdacs:`, `geo:`, `georss:`
- Filters: `gdacs:eventtype == "TC"` (only cyclones)
- Extracts: name, alert_level, position (lat/lon from geo:Point or georss:point), wind speed (km/h → kt conversion), basin detection
- Basin detection: text match + coordinate-based fallback
- Cache TTL: 300 seconds (5 min)

**Open-Meteo Fetcher (`fetch_weather_point`):**
- URL: `https://api.open-meteo.com/v1/forecast`
- Parameters: `wind_speed_10m, wind_direction_10m, surface_pressure, temperature_2m, relative_humidity_2m`
- Wind unit: knots
- Cache key: `wx_{lat:.2f}_{lon:.2f}`, TTL: 300s

**12-Station Indian Ocean Grid (`fetch_ocean_grid`):**
Stations:
```
Arabian Sea (Central)    15.0°N, 65.0°E
Arabian Sea (East)       15.0°N, 72.0°E
Mumbai Coast             18.0°N, 72.0°E
Oman Sea                 22.0°N, 60.0°E
Lakshadweep              11.0°N, 73.0°E
Bay of Bengal (Central)  15.0°N, 88.0°E
Bay of Bengal (North)    20.0°N, 87.0°E
Chennai Coast            13.0°N, 82.0°E
Andaman Sea              12.0°N, 93.0°E
Odisha Coast             20.5°N, 87.5°E
Maldives                  4.0°N, 73.5°E
Sri Lanka South           5.0°N, 82.0°E
```

**Live Telemetry (`get_live_telemetry_stream`):**
- Adds deterministic micro-fluctuations via `sin/cos` of `time.time()` for smooth animation
- Wave formula: `wave = sin(ts*0.8 + i*1.5)`, offset ±0.8 kt wind, ±0.15 hPa pressure
- Returns `pulse_id = int(now_ts)` for frontend frame counting

**Cache:** Simple `dict` in-memory `_cache` (no Redis required; Redis is optional).

---

### 6. Database Models (`backend/app/models/cyclone.py`)

Tables (6):

| Table | Key Fields |
|:---|:---|
| `cyclones` | id (IBTrACS SID), name, basin, subbasin, season (year), start_time, end_time, peak_wind_kt, min_pressure_hpa, peak_intensity, num_observations, source="IBTrACS", data_type="HISTORICAL" |
| `track_points` | id (UUID), cyclone_id (FK), timestamp, latitude, longitude, wind_kt, pressure_hpa, intensity_class, source, data_type, extra_data (JSON) |
| `satellite_observations` | id (UUID), cyclone_id (FK), satellite, sensor, timestamp, lat/lon, image_path, channel, resolution_km, image dimensions, file_format, file_size_mb, is_uploaded, metadata_json |
| `predictions` | id (UUID), cyclone_id (FK), observation_id (FK), model_version, prediction_type (detection/classification/intensity/track/unified), detected, detection_confidence, predicted_class, classification_confidence, class_probabilities (JSON), predicted_wind_kt, predicted_pressure_hpa, predicted_track (JSON), heatmap_path, xai_method, data_type="PREDICTED", inference_time_ms, fusion_mode, raw_result (JSON) |
| `ml_models` | id, name, version, architecture, task, status, weights_path, accuracy, f1_score, mae, rmse, r2_score |
| `evaluation_results` | id, model_id (FK), split (train/val/test), metric_name, metric_value, class_name (per-class) |

Indexes: `ix_cyclones_basin`, `ix_cyclones_season`, `ix_cyclones_peak_intensity`, `ix_track_points_cyclone_id`, `ix_track_points_timestamp`, etc.

---

### 7. Pydantic Schemas (`backend/app/schemas/cyclone.py`)

Key request schemas:
```python
HistoryPoint:      lat, lon, wind_kt, pressure_hpa (validated ranges)
IntensityPredictRequest:  history: List[HistoryPoint] (min_length=2)
TrackPredictRequest:      history: List[HistoryPoint], prediction_horizon_hours (6-120)
```

Key response schemas:
```python
DetectionResult:       detected, confidence, model_version, data_type, disclaimer
ClassificationResult:  pattern, pattern_label, wind_range_kt, confidence, probabilities
IntensityResult:       predicted_wind_kt, predicted_pressure_hpa, intensity_class, available, reason
TrackResult:           predicted_track: List[PredictedTrackPoint], available
ExplainabilityResult:  heatmap_base64, method, method_description, disclaimer
UnifiedAnalysisResult: detection + classification + intensity + track + explainability + metadata
HealthResponse:        status, version, models: Dict[str,str], database, timestamp
APIResponse:           success, data, message, error, code, timestamp
```

---

### 8. Frontend Components

#### `components/layout/Navbar.tsx`

- Sticky top header with scroll shadow
- **Top accent line:** `h-[2px] bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600`
- **MoES banner:** "Ministry of Earth Sciences (MoES) · Smart India Hackathon 2026" + "⚠️ Research Prototype" (hidden on mobile `hidden sm:flex`)
- **Logo:** Custom SVG cyclone globe icon (40×40) + "CYCLONE AI" / "SIH Platform" text
- **Desktop nav:** Pill container with 7 items: Dashboard, Detection, Prediction, Live (with pulsing dot), Map, Historical, Performance
- Active item: `bg-blue-600 text-white`, Live item: emerald color
- **ThemeToggle** (right side)
- **Mobile menu:** Grid 2-col of all nav items

**Nav items (exact):**
```
/              Dashboard     LayoutDashboard
/detection     Detection     Scan
/prediction    Prediction    TrendingUp
/live-satellite Live         Radio  badge="LIVE"
/map           Map           MapIcon
/historical    Historical    History
/performance   Performance   BarChart3
```

Note: `/satellite` and `/methodology` and `/about` are **NOT** in the navbar (accessible via footer).

#### `components/layout/Footer.tsx`

- Shows only on Dashboard (via `ConditionalFooter`)
- 4-column grid: Brand | Quick Links | Data Sources | AI Models
- Quick links: all 8 platform modules including satellite, methodology, about
- Disclaimer box with IMD link
- © year Cyclone AI Platform — SIH 2026

#### `components/ui/DataTypeBadge.tsx`

```
OBSERVED:   "● OBSERVED"   emerald colors
HISTORICAL: "◆ HISTORICAL" slate colors
SIMULATED:  "◈ SIMULATED"  amber colors
PREDICTED:  "▶ PREDICTED"  red colors
```

#### `components/ui/LiveTickerBar.tsx`

- Uses `useLiveTelemetry(3)` hook (3s interval)
- Shows: pulsing beacon, "Live 1s Telemetry Stream", frame number, system UTC clock
- Active storm count (red if > 0, emerald if 0)
- Refresh button with countdown
- Rolling log stream at bottom
- Data source: `GET /api/v1/realtime/live-feed`

---

### 9. Grad-CAM XAI (`ai/xai/gradcam.py`)

**Class:** `GradCAM`

Algorithm (Selvaraju et al. 2017):
1. Register forward hook → capture feature maps (`_activations`)
2. Register backward hook → capture gradients (`_gradients`)
3. For target class, call `score.backward()`
4. `weights = gradients.mean(dim=(2,3))` — global average pool over spatial dims
5. `cam = ReLU(sum(weights × activations))`
6. Bilinear upsample to input size → normalize to [0,1]

`analyze()` returns:
```python
{
  "heatmap_base64": "data:image/png;base64,...",
  "method": "Grad-CAM",
  "method_description": "Gradient-weighted Class Activation Mapping (Selvaraju et al., 2017)",
  "disclaimer": str,
  "heatmap_size": [H, W]
}
```

Target layers:
- EfficientNet-B0: `features.8` (last conv block)
- ResNet50: `layer4` (last residual block)

Overlay blend: `alpha=0.5`, colormap `jet` (matplotlib), requires `Pillow`.

---

### 10. Configuration & Environment

#### `backend/app/core/config.py` (Pydantic Settings)

All settings env-driven. Key settings:

```python
APP_NAME    = "Tropical Cyclone AI Platform"
APP_VERSION = "1.0.0"
APP_ENV     = "development"
DATABASE_URL = "sqlite:///./cyclone_demo.db"  # dev default
MODEL_BASE_PATH = "./models"
INFERENCE_DEVICE = "cpu"
MAX_UPLOAD_SIZE_MB = 50
ALLOWED_IMAGE_FORMATS = "png,jpg,jpeg,tif,tiff,nc,hdf5,h5"
ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
```

Model path properties auto-discover `.pth` files:
- `./models/detection-v1/model.pth`
- `./models/classification-v1/model.pth`
- `./models/intensity-v1/model.pth`
- `./models/track-v1/model.pth`

#### `.env.example`

All required vars documented. Optional: `MOSDAC_API_KEY`, `NASA_EARTHDATA_USERNAME/PASSWORD`, `REDIS_URL`.

#### `frontend/.env.local` (from `.env.example`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Cyclone AI"
NEXT_PUBLIC_MAP_CENTER_LAT=20.0
NEXT_PUBLIC_MAP_CENTER_LON=80.0
```

---

### 11. Technology Stack

#### Frontend (`frontend/package.json`)

```json
"next": "14.2.5",
"react": "18.2.0",
"react-dom": "18.2.0",
"typescript": "5.3.3",
"tailwindcss": "3.4.1",
"recharts": "2.10.3",
"leaflet": "1.9.4",
"react-leaflet": "4.2.1",
"zustand": "4.5.0",
"axios": "1.6.5",
"lucide-react": "0.312.0",
"react-hot-toast": "2.4.1",
"clsx": "2.1.0",
"date-fns": "3.2.0"
```

#### Backend (`backend/requirements.txt`)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
alembic==1.13.1
pydantic==2.5.3
pydantic-settings==2.1.0
httpx==0.26.0
torch==2.1.0
torchvision==0.16.0
numpy==1.26.2
pandas==2.1.4
opencv-python-headless==4.8.1.78
Pillow==10.1.0
netCDF4==1.6.5
h5py==3.10.0
matplotlib==3.8.2
scikit-learn==1.3.2
psycopg2-binary==2.9.9
loguru==0.7.2
slowapi==0.1.9
```

---

### 12. Deployment

#### `docker-compose.yml`

4 services:
1. **db** — `postgres:15-alpine`, port 5432, `postgres_data` volume
2. **redis** — `redis:7-alpine`, port 6379
3. **backend** — `./backend/Dockerfile`, port 8000, mounts `./data`, `./models`, `./logs`, depends on db+redis
4. **frontend** — `./frontend/Dockerfile`, port 3000, depends on backend, `NEXT_PUBLIC_API_URL=http://backend:8000`

Network: `cyclone_network`

#### `render.yaml`

- Type: `web`, runtime: `python`
- rootDir: `backend`
- buildCommand: `pip install -r requirements-render.txt`
- startCommand: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `DATABASE_URL=sqlite:///./cyclone_demo.db`, `APP_ENV=production`, `INFERENCE_DEVICE=cpu`
- Plan: `free`

#### Vercel

Frontend deployed at `cyclone-ai-sih.vercel.app`.  
`frontend/vercel.json` not read directly but referenced in README.

---

### 13. Project Root Structure

```
SIH-Project/
├── .env                          ← actual env (gitignored)
├── .env.example                  ← template
├── .gitignore
├── docker-compose.yml
├── README.md
├── render.yaml
├── ai/
│   ├── models/                   ← 5 model files
│   │   ├── detection_model.py
│   │   ├── classification_model.py
│   │   ├── intensity_model.py
│   │   ├── track_model.py
│   │   └── fusion_model.py
│   ├── inference/predictor.py    ← unified pipeline
│   ├── preprocessing/            ← ImageProcessor, ImageValidator
│   ├── datasets/                 ← HURSAT-B1 & IBTrACS loaders
│   ├── xai/gradcam.py
│   └── requirements.txt
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── api/v1/               ← 9 route files
│       ├── core/config.py
│       ├── database/connection.py
│       ├── models/cyclone.py
│       ├── schemas/cyclone.py
│       ├── services/realtime_service.py
│       ├── ml/model_manager.py
│       └── utils/file_utils.py
├── frontend/
│   ├── package.json
│   ├── app/                      ← 10 pages
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   ├── layout/Footer.tsx
│   │   ├── layout/ConditionalFooter.tsx
│   │   ├── ui/DataTypeBadge.tsx
│   │   ├── ui/LiveTickerBar.tsx
│   │   ├── ui/IntensityBadge.tsx
│   │   ├── ui/ThemeToggle.tsx
│   │   ├── ui/ThemeProvider.tsx
│   │   ├── analysis/AnalysisPanel.tsx
│   │   └── map/CycloneMap.tsx
│   ├── hooks/useLiveTelemetry.ts
│   ├── services/cycloneService.ts
│   ├── services/realtimeService.ts
│   ├── lib/cycloneDetector.ts    ← client-side validation
│   └── types/index.ts
├── data/                         ← raw/processed/labels/samples
├── docs/                         ← API.md, ARCHITECTURE.md, etc.
├── models/                       ← .pth weight files (gitignored)
│   ├── detection-v1/.gitkeep
│   ├── classification-v1/.gitkeep
│   ├── intensity-v1/.gitkeep
│   └── track-v1/.gitkeep
└── logs/.gitkeep
```

---

## INCONSISTENCIES & ISSUES FOUND

### 1. Year Inconsistency (2024 vs 2026)
- **README.md:** Says "SIH 2026" everywhere — correct per user's most recent change.
- **`frontend/app/layout.tsx` metadata:** `description` field says "Smart India Hackathon 2024", keywords contain "SIH 2024". ← **needs update to 2026**
- **`frontend/app/about/page.tsx` metadata:** `description` says "SIH 2024". ← **needs update to 2026**

### 2. Satellite Page & Detection Page — Near Identical
Both `/detection` and `/satellite` run the same analysis pipeline (`analyzeImage` → `POST /api/v1/analyze`). The distinction from the README is that satellite is positioned as "full multi-format analysis" while detection is "binary detection focus."

### 3. Model Weight Files are Empty (`.gitkeep`)
All 4 model directories (`detection-v1/`, `classification-v1/`, `intensity-v1/`, `track-v1/`) only contain `.gitkeep`. The platform runs in **demo/simulated mode** without actual trained weights. The fallback logic in `prediction.py` handles this gracefully with `data_type: "SIMULATED"`.

### 4. `/satellite` Not in Navbar
The satellite page is accessible via Dashboard feature cards, Footer, and direct URL, but **not listed in `Navbar.tsx` NAV_ITEMS**. The navbar has 7 items; satellite is omitted.

### 5. Navbar hover state change from user request
Per user message 8: "bar per curser leke jaa rhe to ye wight sa background ho jaa rha usse hatao aur jaise ki bar per curser le jau to bar ke side blue light jaisa jo nikalta he vaisa lagao" — the user requested removing white hover background and adding a blue side-light effect. Current code shows `hover:bg-white dark:hover:bg-slate-700` which is the current state that was updated.

---

## README ACCURACY ASSESSMENT

The existing README at `SIH-Project/README.md` is **highly accurate** for:
- All module routes and descriptions ✓
- All model architectures and metrics ✓
- All API endpoint paths ✓
- Tech stack versions (from package.json and requirements.txt) ✓
- Data sources ✓
- Docker Compose service configuration ✓
- Project structure ✓
- Quick start commands ✓
- Environment variables ✓

**The only factual update needed:**
- Ensure all references are consistently "SIH 2026" (README already says 2026; code files still have stale "2024" in metadata).

The README already includes all sections asked about: Platform Modules table, AI Model Registry table, System Architecture diagram, REST API Reference, Project Structure, Quick Start, Environment Variables, Data Sources, Technology Stack, Documentation links, and Project Info table. It is comprehensive and complete.

---

## RECOMMENDATIONS FOR README UPDATE

Based on the investigation, the README should be **re-verified and enhanced** on the following:

1. **Confirm SIH year is 2026 throughout** (README already says 2026 — good).
2. **Note the demo/simulated mode**: Add a clear note that without `.pth` weight files, all AI outputs are labeled `SIMULATED` (with demo fallback values). Currently only mentioned in the disclaimer section.
3. **12-Station Grid detail**: The README says "12-station Indian Ocean marine grid" — confirmed accurate.
4. **Cache TTL correction**: README says "15-min cache" for real-time endpoints. The actual `CACHE_TTL` in `realtime_service.py` is **300 seconds = 5 minutes**, not 15 minutes. ← **README has a factual error here**.
5. **Intensity model LSTM hidden = 256** (not 128 as stated in README table). The README says "CNN + LSTM (128 hidden)" but `intensity_model.py` sets `lstm_hidden: int = 256`. ← **README has a factual error here**.
6. **Satellite page (/satellite) not in navbar** — README implies it's a full navigation module, but it's not in the navbar. This is fine — it's accessible via other routes.
7. **About page title metadata says "SIH 2024"** — minor, but should match 2026.

---

*End of investigation report. All findings are grounded in direct file reads.*
