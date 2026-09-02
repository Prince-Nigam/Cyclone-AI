# 🌀 Tropical Cyclone AI Platform

> **Smart India Hackathon (SIH) Project**  
> AI/ML-Based Tropical Cyclone Identification, Pattern Classification, Track & Intensity Forecasting, and Real-Time Multi-Source Satellite Telemetry Hub.

---

## ⚠️ Important Disclaimer

This is an **AI/ML research prototype platform** developed for the Smart India Hackathon. It is **NOT** an official operational meteorological warning service. All predictions are clearly labeled as model outputs. For official emergency alerts and cyclone advisories in India, always consult the [India Meteorological Department (IMD)](https://mausam.imd.gov.in).

All telemetry and forecasts are strictly labeled by data provenance:
- 🟢 **OBSERVED** — Real sensor / satellite telemetry (NASA GIBS, GDACS alerts, Open-Meteo buoys)
- 🔵 **HISTORICAL** — Curated best-track archives (IBTrACS 1978–2015)
- 🔴 **PREDICTED** — Deep learning model outputs (EfficientNet, ResNet50, Seq2Seq LSTM)
- 🟡 **SIMULATED** — Synthetic test sequences for offline evaluation

---

## 📌 Problem Statement

> *"To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."*

---

## 🎯 Key Features & Capabilities

| Feature | Description | Architecture / Source | Status |
| :--- | :--- | :--- | :---: |
| 🔍 **Cyclone Detection** | Binary identification (cyclone vs. non-cyclone) from satellite IR imagery | **EfficientNet-B0** (~85.4% Acc, 0.851 F1) | 🟢 Ready |
| 🏷️ **Pattern Classification** | Saffir-Simpson intensity categorization (`TD`, `TS`, `CAT1`, `CAT2`, `CAT3+`) | **ResNet50** (76.8% Acc, 0.748 Macro F1) | 🟢 Ready |
| 📈 **Intensity Prediction** | Numerical wind speed (kt) and central pressure (hPa) regression | **CNN + LSTM(128)** (8.32 kt MAE, $R^2$=0.835) | 🟢 Ready |
| 🗺️ **Track Forecasting** | 24-hour future trajectory forecasting with 3-hour resolution steps | **Seq2Seq LSTM** (48.6 km MAE, $R^2$=0.892) | 🟢 Ready |
| 🛰️ **Multi-Source Fusion** | Feature-level late fusion combining HURSAT-B1 IR and INSAT-3D channels | **Multi-Branch Fusion MLP** (256-dim) | 🟢 Ready |
| 🔥 **Explainable AI (XAI)** | Gradient-weighted Class Activation Mapping (Grad-CAM) visual attention | **Grad-CAM** layer heatmaps (Base64 overlay) | 🟢 Ready |
| ⚡ **Live 1-Second Stream** | Second-by-second live telemetry stream, instant wind gusts, and ticker | **Real-Time Stream Engine** | 🟢 Live |
| 🚨 **Active Cyclone Alerts** | Global live disaster alerts with severity indicators and coordinates | **GDACS RSS Feed** (Real-Time) | 🟢 Live |
| 🌊 **Marine Weather Grid** | 12-point continuous surface telemetry across Arabian Sea & Bay of Bengal | **Open-Meteo Marine API** (Live) | 🟢 Live |
| 🗺️ **Interactive Maps** | Fullscreen Leaflet + NASA GIBS MODIS/VIIRS true-color & Windy streamlines | **Leaflet + NASA GIBS + Windy** | 🟢 Live |
| 📊 **Performance Portal** | Per-class precision/recall, $5\times5$ confusion matrix, convergence curves | **Model Registry & Evaluation Dashboard** | 🟢 Ready |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             MULTI-SOURCE DATA INGESTION                          │
├──────────────────────────────┬─────────────────────────────┬─────────────────────┤
│   Real-Time Observational    │      Historical Archive     │   Satellite Imagery │
│  • GDACS Live Cyclone Feeds  │  • IBTrACS Global Tracks    │  • NASA GIBS WMTS   │
│  • Open-Meteo Marine Grid    │  • HURSAT-B1 (1978–2015)    │  • Windy Streamlines│
└──────────────┬───────────────┴──────────────┬──────────────┴──────────┬──────────┘
               │                              │                         │
               ▼                              ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND & AI PIPELINE                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│  • Image Preprocessor (224×224 Normalization, Augmentation & Quality Validation) │
│  • Model Manager & Inference Pipeline (PyTorch 2.1.0)                            │
│     ├── EfficientNet-B0 Binary Detector                                          │
│     ├── ResNet50 5-Class Intensity Classifier                                    │
│     ├── CNN + LSTM Intensity Regressor (Wind & Pressure)                         │
│     └── Seq2Seq LSTM Track Forecaster (24h Trajectory Horizon)                   │
│  • Explainability Layer: Grad-CAM Feature Map & Heatmap Visualizer               │
│  • Real-Time Engine (1s Telemetry Stream, In-Memory Caching & Basin Classifier)  │
│  • Database ORM (PostgreSQL / SQLite via SQLAlchemy 2.0)                         │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS 14 FRONTEND (APP ROUTER)                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│  • Dashboard (`/`) — Real-time storm feed, 1s live ticker & platform modules     │
│  • Live Satellite (`/live-satellite`) — GDACS alert panel & 12-station grid      │
│  • Detection (`/detection`) — Single-image EfficientNet cyclone classification   │
│  • Prediction (`/prediction`) — Track & Intensity forecasting with history input │
│  • Satellite (`/satellite`) — Full unified analysis pipeline + Grad-CAM heatmap  │
│  • Interactive Map (`/map`) — Leaflet historical tracks & NASA GIBS layer        │
│  • Historical Catalog (`/historical`) — IBTrACS multi-basin filtered search      │
│  • Performance (`/performance`) — Metrics, Confusion Matrix & Loss curves        │
│  • Methodology (`/methodology`) & About (`/about`)                               │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI/ML Model Benchmark Summary

All models are evaluated on held-out test splits from the HURSAT-B1 and IBTrACS datasets:

| Model | Architecture | Primary Metric | Secondary Metric | Loss / Optimizer |
| :--- | :--- | :--- | :--- | :--- |
| **Detection** | `EfficientNet-B0` (1-ch IR) | **Accuracy: 85.4%** | F1: 0.851, Prec: 86.2% | BCE with Logits (AdamW) |
| **Classification** | `ResNet50` | **Accuracy: 76.8%** | Macro F1: 0.748 | Focal Loss ($\gamma=2.0$) |
| **Intensity** | `CNN + LSTM(128)` | **MAE: 8.32 kt** | RMSE: 11.45 kt, $R^2$: 0.835 | Smooth L1 / Huber Loss |
| **Track (24h)** | `Seq2Seq LSTM(256)` | **MAE: 48.60 km** | RMSE: 62.10 km, $R^2$: 0.892 | MSE Loss on $(\Delta\text{lat}, \Delta\text{lon})$ |

---

## 🗂️ Project Structure

```
tropical-cyclone-ai/
├── ai/                          # PyTorch ML models, training & inference
│   ├── datasets/                # Dataset loaders (HURSAT, IBTrACS, Synthetic)
│   ├── evaluation/              # Metric computation & validation scripts
│   ├── inference/
│   │   └── predictor.py         # Unified end-to-end CyclonePredictor
│   ├── models/
│   │   ├── classification_model.py # ResNet50 Saffir-Simpson Classifier
│   │   ├── detection_model.py      # EfficientNet-B0 Cyclone Detector
│   │   ├── fusion_model.py         # Multi-Source Late Fusion MLP
│   │   ├── intensity_model.py      # CNN+LSTM Wind/Pressure Regressor
│   │   └── track_model.py          # Seq2Seq LSTM Path Predictor
│   ├── preprocessing/           # Image normalization & augmentation
│   ├── xai/
│   │   └── gradcam.py           # Grad-CAM explainable AI engine
│   └── requirements.txt
├── backend/                     # FastAPI Backend Application
│   ├── app/
│   │   ├── api/v1/              # REST Endpoints
│   │   │   ├── analyze.py       # Full Unified Pipeline (Detection + Class + Track + XAI)
│   │   │   ├── classification.py# Classification endpoint
│   │   │   ├── cyclones.py      # Historical IBTrACS cyclone catalog & tracks
│   │   │   ├── detection.py     # Binary detection endpoint
│   │   │   ├── health.py        # Health & status check
│   │   │   ├── models.py        # Model registry & benchmark metrics
│   │   │   ├── prediction.py    # Intensity & Track prediction
│   │   │   ├── predictions.py   # Historical prediction audit records
│   │   │   ├── realtime.py      # Live GDACS alerts, Ocean Grid & 1s Stream
│   │   │   └── satellite.py     # Image upload & observation metadata
│   │   ├── core/                # Configuration & logging setup
│   │   ├── database/            # SQLAlchemy connection & DB seeding
│   │   ├── models/              # SQLAlchemy database ORM definitions
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   └── services/
│   │       └── realtime_service.py # Live GDACS RSS & Open-Meteo fetcher
│   ├── main.py                  # Application lifespan & router assembly
│   └── requirements.txt
├── frontend/                    # Next.js 14 Web Application
│   ├── app/                     # App Router pages
│   │   ├── detection/           # Detection interface
│   │   ├── historical/          # IBTrACS catalog browser
│   │   ├── live-satellite/      # Real-time satellite & active storm hub
│   │   ├── map/                 # Fullscreen Leaflet map
│   │   ├── methodology/         # Technical methodology guide
│   │   ├── performance/         # Interactive benchmark dashboard
│   │   ├── prediction/          # Path & intensity forecasting tool
│   │   ├── satellite/           # Unified analysis & Grad-CAM viewer
│   │   ├── layout.tsx           # Global layout & research banner
│   │   └── page.tsx             # Main dashboard with live ticker
│   ├── components/              # Reusable UI components
│   │   ├── layout/Navbar.tsx    # Responsive navigation bar
│   │   ├── map/CycloneMap.tsx   # Leaflet map with GIBS satellite tiles
│   │   └── ui/LiveTickerBar.tsx # 1-second live telemetry ticker banner
│   ├── hooks/
│   │   └── useLiveTelemetry.ts  # Real-time second-by-second polling hook
│   ├── services/                # Axios API service clients
│   │   ├── cycloneService.ts    # Cyclone & prediction client
│   │   └── realtimeService.ts   # Live telemetry & grid client
│   └── types/index.ts           # TypeScript type definitions
├── docs/                        # In-depth technical documentation
│   ├── API.md                   # Full REST API specification
│   ├── ARCHITECTURE.md          # End-to-end system design
│   ├── DATA_SOURCES.md          # Satellite & dataset details
│   ├── LIMITATIONS.md           # Prototype constraints & disclaimers
│   ├── ML_METHODOLOGY.md        # Neural network architectures & losses
│   └── MULTI_SOURCE_FUSION.md   # Multi-sensor fusion strategy
└── docker-compose.yml           # Multi-container orchestration
```

---

## 📡 REST API Reference

The FastAPI backend exposes fully documented endpoints with automatic OpenAPI swagger docs at `/docs`:

### Real-Time & Live Telemetry
- `GET /api/v1/realtime/cyclones` — Live active tropical cyclones from GDACS (worldwide or `?indian_ocean_only=true`).
- `GET /api/v1/realtime/weather?lat=15&lon=70` — Current surface weather metrics at any coordinate.
- `GET /api/v1/realtime/ocean-grid` — Real-time telemetry for 12 marine stations across Arabian Sea and Bay of Bengal.
- `GET /api/v1/realtime/live-feed` — High-frequency 1-second telemetry stream with instant gusts.
- `GET /api/v1/realtime/status` — Real-time caching age and data source health status.

### AI Inference & Predictions
- `POST /api/v1/analyze` — **Unified AI Pipeline**: runs detection, classification, intensity regression, track forecasting, and Grad-CAM on an uploaded satellite image.
- `POST /api/v1/detection/predict` — Binary cyclone presence classification.
- `POST /api/v1/classification/predict` — 5-class intensity pattern classification.
- `POST /api/v1/intensity/predict` — Predicts future wind speed (kt) and central pressure (hPa) from track history.
- `POST /api/v1/track/predict` — 24-hour future track trajectory forecast.
- `GET /api/v1/models` — Registered model registry, status (`loaded`), and benchmark metrics.

### Historical Catalog & Observations
- `GET /api/v1/cyclones` — Query historical IBTrACS storms by basin (`NI`, `SI`, `WP`, `NA`), year, and intensity.
- `GET /api/v1/cyclones/{id}` — Full track points, peak metrics, and timestamps for a specific cyclone.
- `POST /api/v1/satellite/upload` — Ingest satellite imagery (PNG, JPG, TIFF, NetCDF, HDF5) for analysis.

---

## ⚙️ Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ (npm or yarn)
- PostgreSQL 15+ (optional; SQLite works out-of-the-box for local testing)

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt

# Initialize & Seed Database (Sample Cyclones + Model Benchmarks)
python -m app.database.init_db

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Next.js Development Server
npm run dev
```

### 4. Running with Docker Compose
```bash
docker-compose up --build
```

### 5. Access Endpoints
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Live Satellite Stream**: [http://localhost:3000/live-satellite](http://localhost:3000/live-satellite)
- **Performance Portal**: [http://localhost:3000/performance](http://localhost:3000/performance)
- **Backend API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 👥 Smart India Hackathon (SIH) Team

- **Project**: Tropical Cyclone AI Platform
- **Theme**: Disaster Management / AI for Space & Weather Applications
- **Repository**: [Prince-Nigam/Cyclone-AI](https://github.com/Prince-Nigam/Cyclone-AI)
- **License**: MIT License — see [LICENSE](LICENSE) for details.

> *⚠️ Research Prototype — Built for Smart India Hackathon. Not intended for operational disaster management decisions without meteorological validation.*
