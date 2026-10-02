# 🌀 Tropical Cyclone AI Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.109-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/AI%2FML-PyTorch%202.1-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%203.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

**Smart India Hackathon (SIH) 2026**  
**Organization: Ministry of Earth Sciences (MoES) · Theme: Disaster Management**

*AI/ML-powered tropical cyclone identification, Saffir-Simpson pattern classification,  
24-hour track & intensity forecasting, and real-time multi-source satellite telemetry hub.*

[🌐 Live Demo](https://cyclone-ai-sih.vercel.app) &nbsp;·&nbsp; [📖 API Docs](http://localhost:8000/docs) &nbsp;·&nbsp; [👤 @Prince-Nigam](https://github.com/Prince-Nigam)

</div>

---

## 📌 Problem Statement

> **Organization:** Ministry of Earth Sciences (MoES), Government of India  
> **Category:** Software &nbsp;·&nbsp; **Technology Bucket:** Disaster Management

> *"To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."*

Cyclones in the North Indian Ocean pose severe humanitarian and economic threats. Conventional numerical weather prediction models require massive supercomputing infrastructure and face latency delays. This platform uses deep neural networks trained on satellite and best-track archives to deliver **sub-second inference**, **explainable Grad-CAM heatmaps**, and **real-time global telemetry fusion**.

---

## ⚠️ Disclaimer

> **Research Prototype:** This system is built as an AI/ML research prototype for Smart India Hackathon 2026. It is **NOT** an official operational meteorological warning service. For official cyclone alerts in India, always consult the **[India Meteorological Department (IMD)](https://mausam.imd.gov.in)**.

All data values across the platform are labeled with explicit provenance:

| Badge | Label | Source |
|:---:|:---|:---|
| 🟢 | **OBSERVED** | Live real-world data — GDACS RSS, Open-Meteo, NASA GIBS tiles |
| 🔵 | **HISTORICAL** | Curated archives — IBTrACS 1978–2015, HURSAT-B1 IR imagery |
| 🔴 | **PREDICTED** | Neural network model inference outputs |
| 🟡 | **SIMULATED** | Demo fallback values when model `.pth` weights are absent |

---

## 🎯 Platform Modules

| Module | Route | Description |
|:---|:---|:---|
| 🏠 **Dashboard** | `/` | Live GDACS storm monitor, stat cards, tabbed cyclone table (live + IBTrACS), 4-pillar architecture overview |
| 🔍 **Detection** | `/detection` | EfficientNet-B0 binary detection — upload/drag/paste satellite IR image, returns confidence score + Grad-CAM |
| 🛰️ **Satellite Analysis** | `/satellite` | Full pipeline (PNG/JPG/TIFF/NetCDF/HDF5) → detection + classification + Grad-CAM XAI heatmap |
| 📈 **Prediction** | `/prediction` | CNN+LSTM intensity (wind/pressure) + Seq2Seq LSTM 24h track forecast (8 × 3h waypoints) |
| 📡 **Live Feed** | `/live-satellite` | GDACS active cyclones, NASA GIBS satellite tiles, Windy.com streamlines, 12-station Indian Ocean marine grid |
| 🗺️ **Map** | `/map` | Interactive Leaflet GIS map — historical best-tracks, live storm markers, wind radii, satellite layer toggles |
| 📂 **Historical** | `/historical` | IBTrACS catalog 1978–2015 — filter by basin, name, year, peak intensity |
| 📊 **Performance** | `/performance` | Model Registry, per-class Precision/Recall/F1, 5×5 confusion matrix, training convergence (Recharts) |
| 📖 **Methodology** | `/methodology` | ML pipeline documentation — architectures, loss functions, training splits, fusion strategy |
| ℹ️ **About** | `/about` | Project info, MoES alignment, data sources, disclaimer |

> **Navigation:** Dashboard, Detection, Prediction, Live, Map, Historical, Performance are in the top navbar.  
> Satellite Analysis, Methodology, About are accessible via the dashboard hero, feature cards, and footer.

---

## 🤖 AI Model Registry

| # | Task | Architecture | Input | Benchmark | Loss / Optimizer |
|:---|:---|:---|:---|:---|:---|
| 1 | Binary Detection | EfficientNet-B0 (1-ch IR) | `(B,1,224,224)` | Acc **85.4%** · F1 0.851 | BCE with Logits · AdamW lr=1e-4 |
| 2 | Pattern Classification | ResNet50 (5-class) | `(B,1,224,224)` | Acc **76.8%** · F1 0.748 | Focal Loss γ=2.0 · SGD Nesterov lr=5e-4 |
| 3 | Intensity Regression | CNN + LSTM (hidden=**256**, 2 layers) | Sequence × 4 features | MAE **8.32 kt** · R² 0.835 | Smooth L1 (Huber) · Adam lr=1e-3 |
| 4 | Track Forecast 24h | Seq2Seq LSTM (hidden=256, 2 layers) | 8 × 3h history → 8 future steps | MAE **48.6 km** · R² 0.892 | MSE on (Δlat, Δlon) · Adam lr=5e-4 |
| 5 | Multi-Source Fusion | Late Fusion MLP (256-dim) | EfficientNet feats × 2 sources | +~3% over single-source | Cross-Entropy |
| 6 | Explainability | Grad-CAM (last conv layer) | Any inference image | Visual heatmap overlay | — (post-hoc, Selvaraju 2017) |

### Model Architecture Details

**EfficientNet-B0 Detection Head:**
```
GlobalAvgPool → Dropout(0.3) → Linear(1280, 256) → ReLU → Dropout(0.21) → Linear(256, 1)
```

**ResNet50 Classification Head:**
```
GlobalAvgPool → Dropout(0.4) → Linear(2048, 512) → ReLU → Dropout(0.3) → Linear(512, 5)
```

**Intensity LSTM:** `LSTM(input=1284, hidden=256, layers=2)` → `Linear(256,128)` → `Linear(128,2)` → `[wind_kt, pressure_hpa]`

**Track Seq2Seq LSTM:** Encoder `LSTM(4,256,2)` → context → Decoder `LSTM(2,256,2)` + `Linear(256,2)` → 8 × `[Δlat, Δlon]`

**Fusion MLP:** Two EfficientNet-B0 branches (1280-dim each) → concat (2560) → `Linear(2560,512)` → `BN` → `ReLU` → `Linear(512,256)` → `BN` → `ReLU` → `Linear(256,5)`

### Saffir-Simpson Intensity Classes

| Class | Label | Wind Speed |
|:---:|:---|:---|
| TD | Tropical Depression | < 34 kt |
| TS | Tropical Storm | 34–63 kt |
| CAT1 | Category 1 Hurricane | 64–82 kt |
| CAT2 | Category 2 Hurricane | 83–95 kt |
| CAT3+ | Major Cyclone (3/4/5) | ≥ 96 kt |

> **Note:** Model `.pth` weight files are **not included** in the repository (`models/` contains only `.gitkeep` stubs). Without trained weights, all AI inference returns `SIMULATED` demo values via `model_manager._mock_analysis()`. The platform is fully functional in demo mode.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     MULTI-SOURCE DATA INGESTION                      │
├──────────────────────────────┬───────────────────────────────────────┤
│      Live Telemetry          │       Climatological Archives         │
│  • GDACS RSS Feeds           │  • IBTrACS Best-Track (1978–2015)    │
│  • Open-Meteo Marine API     │  • HURSAT-B1 Satellite IR             │
│  • NASA GIBS WMTS Tiles      │  • INSAT-3D / Kalpana-1              │
│  • Windy.com (embedded)      │                                       │
└──────────────┬───────────────┴──────────────────┬────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND  ·  port 8000                          │
├──────────────────────────────────────────────────────────────────────┤
│  Image Preprocessing (224×224 IR, multi-format: PNG/JPG/TIFF/NC/H5) │
│  PyTorch Model Manager (singleton, thread-safe, graceful fallback)   │
│    ├── EfficientNet-B0  ──▶  Binary Cyclone Detection                │
│    ├── ResNet50         ──▶  5-Class Intensity Pattern               │
│    ├── CNN + LSTM(256)  ──▶  Wind Speed (kt) & Pressure (hPa)       │
│    ├── Seq2Seq LSTM     ──▶  24h Future Track (8 × 3h steps)        │
│    ├── Fusion MLP       ──▶  Multi-Source Late Feature Fusion        │
│    └── Grad-CAM Engine  ──▶  Visual Explainability Heatmap           │
│  GDACS / Open-Meteo Fetchers  ·  5-min in-memory cache               │
│  SQLAlchemy 2.0 ORM  ·  SQLite (dev) / PostgreSQL 15 (prod)         │
│  Pydantic v2 validation  ·  Loguru structured logging                │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  REST API  /api/v1/*
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│             NEXT.JS 14 FRONTEND  ·  port 3000                        │
├──────────────────────────────────────────────────────────────────────┤
│  7-item sticky navbar  ·  Dark/Light theme  ·  MoES SIH 2026 banner │
│  Leaflet GIS maps  ·  NASA GIBS WMTS tile layers                     │
│  Recharts (performance benchmarks)  ·  react-hot-toast               │
│  LiveTickerBar (1s telemetry)  ·  GDACS auto-refresh (5 min)        │
│  DataTypeBadge system (OBSERVED / HISTORICAL / PREDICTED / SIMULATED)│
│  Client-side cyclone image validator (cycloneDetector.ts)            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📡 REST API Reference

**Swagger UI:** `http://localhost:8000/docs` &nbsp;·&nbsp; **ReDoc:** `http://localhost:8000/redoc`

### AI Inference

```
POST /api/v1/analyze
    body: file (UploadFile), cyclone_history (JSON str), cyclone_id (str), run_xai (bool)
    → Unified: Detection + Classification + Intensity + Track + Grad-CAM

POST /api/v1/detection/predict
    body: file (UploadFile), satellite_source (str)
    → DetectionResult {detected, confidence, model_version, data_type}

POST /api/v1/classification/predict
    body: file (UploadFile)
    → ClassificationResult {pattern, probabilities, confidence, wind_range_kt}

POST /api/v1/intensity/predict
    body: {history: [{lat,lon,wind_kt,pressure_hpa}], min_length=2}
    → IntensityResult {predicted_wind_kt, predicted_pressure_hpa, intensity_class}

POST /api/v1/track/predict
    body: {history: [...], prediction_horizon_hours: 6-120}
    → TrackResult {predicted_track: [{step,hours_ahead,lat,lon}] × 8}
```

### Real-Time Telemetry

```
GET /api/v1/realtime/cyclones?indian_ocean_only=false
    → Active cyclones from GDACS RSS  ·  5-min cache

GET /api/v1/realtime/weather?lat=15.0&lon=72.0
    → {wind_kt, wind_dir_deg, pressure_hpa, temp_c, humidity_pct}  ·  5-min cache

GET /api/v1/realtime/ocean-grid
    → 12-station Indian Ocean marine snapshot  ·  5-min cache

GET /api/v1/realtime/live-feed
    → 1-second telemetry: {pulse_id, active_cyclones_count, ocean_grid with micro-fluctuations}

GET /api/v1/realtime/status
    → Cache age, data source URLs
```

### Historical & Registry

```
GET /api/v1/cyclones?basin=NI&year=2023&intensity=CAT3_PLUS&name=biparjoy&page=1&limit=20
    → IBTrACS storm list (basins: NI/EP/NA/WP/SP/SI)

GET /api/v1/cyclones/{cyclone_id}
    → Full track + metadata: {id, name, basin, peak_wind_kt, track: [{lat,lon,wind_kt}...]}

GET /api/v1/models
    → ML model registry with benchmark metrics

POST /api/v1/satellite/upload
    → Ingest & store satellite image metadata

GET /health
    → {status, version, models: Dict[str,str], database, timestamp}
```

---

## 📡 12-Station Indian Ocean Marine Grid

The real-time ocean grid monitors these fixed stations via Open-Meteo (5-min cache):

| Station | Lat | Lon | Region |
|:---|:---:|:---:|:---:|
| Arabian Sea (Central) | 15.0°N | 65.0°E | AS |
| Arabian Sea (East) | 15.0°N | 72.0°E | AS |
| Mumbai Coast | 18.0°N | 72.0°E | AS |
| Oman Sea | 22.0°N | 60.0°E | AS |
| Lakshadweep | 11.0°N | 73.0°E | AS |
| Bay of Bengal (Central) | 15.0°N | 88.0°E | BOB |
| Bay of Bengal (North) | 20.0°N | 87.0°E | BOB |
| Chennai Coast | 13.0°N | 82.0°E | BOB |
| Andaman Sea | 12.0°N | 93.0°E | BOB |
| Odisha Coast | 20.5°N | 87.5°E | BOB |
| Maldives | 4.0°N | 73.5°E | IO |
| Sri Lanka South | 5.0°N | 82.0°E | IO |

---

## 🗂️ Project Structure

```
SIH-Project/
├── .env                              ← environment variables (gitignored)
├── .env.example                      ← template for all env vars
├── docker-compose.yml                ← 4-service local orchestration
├── render.yaml                       ← Render cloud backend deployment
├── README.md
│
├── ai/                               ← PyTorch models, training & XAI
│   ├── models/
│   │   ├── detection_model.py        ← EfficientNet-B0 binary classifier
│   │   ├── classification_model.py   ← ResNet50 5-class classifier
│   │   ├── intensity_model.py        ← CNN+LSTM intensity regressor
│   │   ├── track_model.py            ← Seq2Seq LSTM track forecaster
│   │   └── fusion_model.py           ← Late fusion MLP
│   ├── inference/predictor.py        ← CyclonePredictor unified pipeline
│   ├── preprocessing/                ← ImageProcessor, ImageValidator
│   ├── datasets/                     ← HURSAT-B1 & IBTrACS data loaders
│   ├── xai/gradcam.py                ← Grad-CAM heatmap engine
│   └── requirements.txt
│
├── backend/                          ← FastAPI application
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   ← FastAPI entry point, lifespan, CORS
│       ├── api/v1/
│       │   ├── analyze.py            ← Unified pipeline endpoint
│       │   ├── detection.py          ← Binary detection
│       │   ├── classification.py     ← Pattern classification
│       │   ├── prediction.py         ← Intensity + track prediction
│       │   ├── realtime.py           ← GDACS + Open-Meteo live feeds
│       │   ├── cyclones.py           ← IBTrACS historical API
│       │   ├── satellite.py          ← Satellite image upload & metadata
│       │   ├── models.py             ← Model registry
│       │   └── health.py             ← Health check
│       ├── core/config.py            ← Pydantic settings (env-driven)
│       ├── database/                 ← SQLAlchemy connection + seeders
│       ├── models/cyclone.py         ← ORM tables (6 tables)
│       ├── schemas/cyclone.py        ← Pydantic request/response schemas
│       ├── services/
│       │   └── realtime_service.py   ← GDACS/Open-Meteo fetchers + 5-min cache
│       ├── ml/model_manager.py       ← Singleton loader + demo fallback
│       └── utils/file_utils.py       ← Upload validation, temp cleanup
│
├── frontend/                         ← Next.js 14 App Router
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx                ← Root layout: Navbar, ConditionalFooter
│   │   ├── globals.css               ← Design tokens, component classes
│   │   ├── page.tsx                  ← Dashboard
│   │   ├── detection/                ← Binary detection UI
│   │   ├── satellite/                ← Full analysis + Grad-CAM UI
│   │   ├── prediction/               ← Track & intensity UI
│   │   ├── live-satellite/           ← Live storm feed hub
│   │   ├── map/                      ← Interactive Leaflet map
│   │   ├── historical/               ← IBTrACS catalog
│   │   ├── performance/              ← Benchmarks + Recharts
│   │   ├── methodology/              ← ML pipeline docs
│   │   └── about/                    ← Project info
│   ├── components/
│   │   ├── layout/Navbar.tsx         ← Sticky navbar, MoES banner, 7 nav items
│   │   ├── layout/Footer.tsx         ← Footer (Dashboard only via ConditionalFooter)
│   │   ├── analysis/AnalysisPanel.tsx← Unified result display panel
│   │   ├── map/CycloneMap.tsx        ← Leaflet map wrapper
│   │   ├── ui/DataTypeBadge.tsx      ← OBSERVED/HISTORICAL/PREDICTED/SIMULATED
│   │   ├── ui/LiveTickerBar.tsx      ← 1-second telemetry ticker
│   │   ├── ui/IntensityBadge.tsx     ← Saffir-Simpson colored badge
│   │   ├── ui/ThemeToggle.tsx        ← Dark/Light switcher
│   │   └── ui/ThemeProvider.tsx      ← Theme context
│   ├── hooks/useLiveTelemetry.ts     ← Polling hook for live-feed endpoint
│   ├── services/
│   │   ├── cycloneService.ts         ← AI inference + IBTrACS API calls
│   │   └── realtimeService.ts        ← GDACS + ocean-grid API calls
│   ├── lib/
│   │   ├── api.ts                    ← Axios instance (baseURL, interceptors)
│   │   └── cycloneDetector.ts        ← Client-side image validation
│   └── types/index.ts                ← All TypeScript interfaces
│
├── data/                             ← raw/processed/uploads
├── models/                           ← .pth weight files (gitignored, only .gitkeep stubs)
│   ├── detection-v1/.gitkeep
│   ├── classification-v1/.gitkeep
│   ├── intensity-v1/.gitkeep
│   └── track-v1/.gitkeep
├── docs/                             ← Technical documentation
└── logs/                             ← Application logs
```

---

## ⚡ Quick Start

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+ (`npm`)
- **Git**

### Option A — Manual Local Setup

#### 1. Clone

```bash
git clone https://github.com/Prince-Nigam/Cyclone-AI.git
cd Cyclone-AI
```

#### 2. Backend

```bash
cd backend

# Create & activate virtual env
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

# Start backend (auto-creates SQLite DB & seeds sample data)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend: **http://localhost:8000** &nbsp;·&nbsp; Swagger: **http://localhost:8000/docs**

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:3000**

---

### Option B — Docker Compose (Full Stack)

```bash
docker-compose up --build
```

| Service | URL |
|:---|:---|
| Frontend | http://localhost:3000 |
| Backend + Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis (cache) | localhost:6379 |

---

## ⚙️ Environment Variables

Create `.env` in the project root (see `.env.example`):

```env
# ── Application ────────────────────────────────────────────────
APP_ENV=development
DEBUG=True
APP_VERSION=1.0.0

# ── Database ────────────────────────────────────────────────────
# SQLite (dev / demo — default)
DATABASE_URL=sqlite:///./cyclone_demo.db
# PostgreSQL (production)
# DATABASE_URL=postgresql://user:password@localhost:5432/cyclone_db

# ── Backend ─────────────────────────────────────────────────────
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ── ML Models ───────────────────────────────────────────────────
MODEL_BASE_PATH=./models
INFERENCE_DEVICE=cpu           # or "cuda"
# Without .pth files, platform runs in SIMULATED demo mode

# ── File Upload ─────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./data/uploads
ALLOWED_IMAGE_FORMATS=png,jpg,jpeg,tif,tiff,nc,hdf5,h5

# ── Optional ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0
```

**Frontend** — `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Cyclone AI — SIH
NEXT_PUBLIC_MAP_CENTER_LAT=20.0
NEXT_PUBLIC_MAP_CENTER_LON=80.0
```

---

## 📊 Data Sources

| Source | Type | Used for |
|:---|:---:|:---|
| [GDACS RSS](https://www.gdacs.org/xml/rss.xml) | 🟢 OBSERVED | Active cyclone alerts — Dashboard, Live Feed, Map |
| [Open-Meteo Marine](https://open-meteo.com) | 🟢 OBSERVED | 12-station Indian Ocean grid, point weather queries |
| [NASA GIBS WMTS](https://gibs.earthdata.nasa.gov) | 🟢 OBSERVED | MODIS/VIIRS satellite tile layers — Map, Live Feed |
| [Windy.com](https://www.windy.com) | 🟢 OBSERVED | Wind streamlines (embedded iframe) — Live Satellite page |
| [IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive) | 🔵 HISTORICAL | Best-track archive (1978–2015), Historical catalog, training labels |
| [HURSAT-B1](https://www.ncei.noaa.gov/products/hursat) | 🔵 HISTORICAL | Satellite IR brightness-temp images for model training |
| INSAT-3D / Kalpana-1 | 🔵 HISTORICAL | Multi-source fusion second encoder branch |

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|:---|:---|:---:|
| Frontend framework | Next.js (App Router) | 14.2.5 |
| UI library | React | 18.2.0 |
| Language | TypeScript | 5.3.3 |
| Styling | Tailwind CSS | 3.4.1 |
| Charts | Recharts | 2.10.3 |
| Maps | Leaflet + react-leaflet | 1.9.4 / 4.2.1 |
| State management | Zustand | 4.5.0 |
| HTTP client | Axios | 1.6.5 |
| Icons | lucide-react | 0.312.0 |
| Toast notifications | react-hot-toast | 2.4.1 |
| Backend framework | FastAPI | 0.109.0 |
| ASGI server | Uvicorn | 0.27.0 |
| ORM | SQLAlchemy | 2.0.25 |
| Validation | Pydantic + pydantic-settings | 2.5.3 |
| Database (dev) | SQLite | — |
| Database (prod) | PostgreSQL | 15 |
| Cache (optional) | Redis | 7 |
| ML framework | PyTorch | 2.1.0 |
| Vision models | torchvision | 0.16.0 |
| Image processing | OpenCV headless | 4.8.1 |
| Scientific I/O | netCDF4, h5py | 1.6.5 / 3.10.0 |
| Logging | Loguru | 0.7.2 |
| Deployment (local) | Docker Compose | 3.9 |
| Deployment (backend) | Render (free tier) | — |
| Deployment (frontend) | Vercel | — |

---

## 📖 Documentation

| Document | Description |
|:---|:---|
| [`docs/API.md`](docs/API.md) | Full REST API endpoint reference with request/response schemas |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, component interaction, caching strategy |
| [`docs/ML_METHODOLOGY.md`](docs/ML_METHODOLOGY.md) | Deep learning architectures, loss functions, training protocol |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Data ingestion pipeline, GDACS XML parsing, IBTrACS loading |
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) | Scientific constraints, resolution bounds, operational safety notes |
| [`docs/MULTI_SOURCE_FUSION.md`](docs/MULTI_SOURCE_FUSION.md) | Late fusion strategy, multi-spectral channel handling |

---

## 👤 Project Information

| Field | Details |
|:---|:---|
| **Project Name** | Tropical Cyclone AI Platform |
| **Event** | Smart India Hackathon (SIH) 2026 |
| **Organization** | Ministry of Earth Sciences (MoES), Government of India |
| **Theme** | Disaster Management / AI & Space Weather Applications |
| **Category** | Software |
| **Problem Statement** | AI/ML-based identification, classification & prediction of tropical cyclone patterns from multi-source satellite data |
| **Author / Lead** | Prince Nigam — [@Prince-Nigam](https://github.com/Prince-Nigam) |
| **Repository** | [github.com/Prince-Nigam/Cyclone-AI](https://github.com/Prince-Nigam/Cyclone-AI) |
| **Live Demo** | [cyclone-ai-sih.vercel.app](https://cyclone-ai-sih.vercel.app) |
| **License** | [MIT](LICENSE) |

---

<div align="center">
  <sub>Built for Smart India Hackathon 2026 · Ministry of Earth Sciences · Advancing meteorological AI for disaster preparedness in the North Indian Ocean region</sub>
</div>
