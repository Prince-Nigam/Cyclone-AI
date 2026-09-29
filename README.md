# 🌀 Tropical Cyclone AI Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/AI%2FML-PyTorch%202.1-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Smart India Hackathon (SIH) 2026**
**Organization: Ministry of Earth Sciences (MoES) · Theme: Disaster Management**

*AI/ML-Powered Tropical Cyclone Identification, Saffir-Simpson Pattern Classification,
24-Hour Track & Intensity Forecasting, and Real-Time Multi-Source Satellite Telemetry Hub.*

[🌐 Live Demo](https://cyclone-ai-sih.vercel.app) · [📖 API Docs](http://localhost:8000/docs) · [👤 Author](https://github.com/Prince-Nigam)

</div>

---

## 📌 Problem Statement

> **Organization:** Ministry of Earth Sciences (MoES), Government of India
> **Category:** Software · **Technology Bucket:** Disaster Management

> *"To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."*

Cyclones in the North Indian Ocean (Arabian Sea and Bay of Bengal) pose severe humanitarian and economic threats. Conventional numerical weather prediction (NWP) models require massive supercomputing infrastructure and often face latency delays. This platform leverages deep neural networks trained on decades of satellite and best-track records to provide **sub-second inference**, **explainable visual heatmaps (Grad-CAM)**, and **real-time global telemetry fusion**.

---

## ⚠️ Important Disclaimer

> **Research Prototype:** This system is developed as an AI/ML research prototype for Smart India Hackathon 2026. It is **NOT** an official operational meteorological warning service. For official emergency alerts, storm advisories, and evacuations in India, always consult the **[India Meteorological Department (IMD)](https://mausam.imd.gov.in)**.

Every data point across the platform is labeled with its provenance:
- 🟢 **OBSERVED** — Live real-world data (GDACS active alerts, Open-Meteo ocean grid, NASA GIBS satellite tiles)
- 🔵 **HISTORICAL** — Curated climatological archives (IBTrACS 1978–2015, HURSAT-B1)
- 🔴 **PREDICTED** — Neural network model inference outputs
- 🟡 **SIMULATED** — Synthetic evaluation runs (demo/offline mode when model weights are absent)

---

## 🎯 Platform Modules

| Module | Route | Description |
|:---|:---|:---|
| 🏠 **Dashboard** | `/` | Live storm monitor (GDACS), stat cards, tabbed cyclone table (live + IBTrACS), system architecture overview |
| 🔍 **Detection** | `/detection` | EfficientNet-B0 binary cyclone detection — upload/paste satellite IR image, returns confidence score |
| 🛰️ **Satellite Analysis** | `/satellite` | Unified multi-format analysis (PNG/JPG/TIFF/NetCDF/HDF5) with ResNet50 classification + Grad-CAM XAI heatmap |
| 📈 **Prediction** | `/prediction` | CNN+LSTM intensity regression (wind/pressure) + Seq2Seq LSTM 24h track forecast (8 × 3h waypoints) |
| 📡 **Live Feed** | `/live-satellite` | Real-time GDACS cyclone alerts, NASA GIBS tiles, Windy.com streamlines, 12-station Indian Ocean marine grid |
| 🗺️ **Map** | `/map` | Interactive Leaflet GIS map — historical best-tracks, live storm markers, wind radii, satellite layer toggles |
| 📂 **Historical** | `/historical` | IBTrACS archive 1978–2015 — searchable by basin, storm name, year, peak intensity |
| 📊 **Performance** | `/performance` | Model Registry, per-class Precision/Recall/F1, 5×5 confusion matrix, training convergence plots (Recharts) |
| 📖 **Methodology** | `/methodology` | ML pipeline details — model architectures, loss functions, training splits, multi-source fusion strategy |
| ℹ️ **About** | `/about` | Project info, MoES alignment, data source attribution, disclaimer |

---

## 🤖 AI Model Registry

| # | Task | Architecture | Input | Primary Metric | Loss |
|:---|:---|:---|:---|:---|:---|
| 1 | Binary Detection | EfficientNet-B0 (1-ch IR) | 224×224 IR image | Acc: **85.4%** · F1: 0.851 | BCE with Logits (AdamW) |
| 2 | Pattern Classification | ResNet50 (5 classes) | 224×224 IR image | Acc: **76.8%** · F1: 0.748 | Focal Loss (γ=2.0) |
| 3 | Intensity Regression | CNN + LSTM (128 hidden) | Track history sequence | MAE: **8.32 kt** · R²: 0.835 | Smooth L1 / Huber |
| 4 | Track Forecast (24h) | Seq2Seq LSTM (256 hidden) | 8 × 3h history points | MAE: **48.60 km** · R²: 0.892 | MSE on (Δlat, Δlon) |
| 5 | Multi-Source Fusion | Late Fusion MLP (256-dim) | CNN feats + LSTM feats + metadata | Classification improvement ~3% | Cross-Entropy |
| 6 | Explainability (XAI) | Grad-CAM (last conv layer) | Any inference image | Visual heatmap overlay | — (post-hoc) |

### Intensity Categories (Saffir-Simpson Scale)
| Class | Label | Wind Speed |
|:---|:---|:---|
| TD | Tropical Depression | < 34 kt |
| TS | Tropical Storm | 34–63 kt |
| CAT1 | Category 1 Hurricane | 64–82 kt |
| CAT2 | Category 2 Hurricane | 83–95 kt |
| CAT3+ | Major Cyclone (3/4/5) | ≥ 96 kt |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-SOURCE DATA INGESTION                      │
├──────────────────────────────┬──────────────────────────────────────┤
│     Live Telemetry           │      Climatological Archives         │
│  • GDACS RSS Feeds           │  • IBTrACS Best-Track (1978–2015)   │
│  • Open-Meteo 12-Point Grid  │  • HURSAT-B1 Satellite IR           │
│  • NASA GIBS Satellite Tiles │  • INSAT-3D / Kalpana-1             │
│  • Windy.com Streamlines     │                                      │
└──────────────┬───────────────┴──────────────────┬───────────────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND  ·  PORT 8000                         │
├─────────────────────────────────────────────────────────────────────┤
│  Image Preprocessing (224×224 IR, multi-format loader)              │
│  PyTorch Model Manager & Inference Pipeline                         │
│    ├── EfficientNet-B0  ──► Binary Cyclone Detection                │
│    ├── ResNet50         ──► 5-Class Intensity Pattern               │
│    ├── CNN + LSTM       ──► Wind Speed (kt) & Pressure (hPa)        │
│    ├── Seq2Seq LSTM     ──► 24h Future Path (8 × 3h steps)         │
│    ├── Fusion MLP       ──► Multi-Source Late Fusion                │
│    └── Grad-CAM Engine  ──► Visual Explainability Heatmap           │
│  GDACS/Open-Meteo Real-Time Fetchers  ·  15-min Cache               │
│  SQLAlchemy 2.0 ORM  ·  SQLite (dev) / PostgreSQL (prod)            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  REST API  /api/v1/*
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│            NEXT.JS 14 FRONTEND  ·  PORT 3000                        │
├─────────────────────────────────────────────────────────────────────┤
│  7 Navigation Routes  ·  Dark/Light Theme  ·  MoES Branding         │
│  Leaflet Interactive GIS Maps  ·  NASA GIBS WMTS Tiles              │
│  Recharts (Perf. Benchmarks)  ·  react-hot-toast Notifications      │
│  1-Second Live Telemetry Ticker  ·  GDACS Auto-Refresh (5 min)      │
│  Data Provenance Badges (OBSERVED / HISTORICAL / PREDICTED)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📡 REST API Reference

Swagger UI: **`http://localhost:8000/docs`** · ReDoc: **`http://localhost:8000/redoc`**

### AI Inference Endpoints
```
POST /api/v1/analyze              — Unified pipeline (Detection + Classification + Intensity + Track + Grad-CAM)
POST /api/v1/detection/predict    — EfficientNet-B0 binary detection only
POST /api/v1/classification/predict — ResNet50 5-class classification only
POST /api/v1/intensity/predict    — CNN+LSTM wind speed & pressure regression
POST /api/v1/track/predict        — Seq2Seq LSTM 24h trajectory forecast
```

### Real-Time Telemetry Endpoints
```
GET  /api/v1/realtime/cyclones    — Active global cyclones from GDACS RSS (?indian_ocean_only=true)
GET  /api/v1/realtime/weather     — Surface weather at any lat/lon (Open-Meteo)
GET  /api/v1/realtime/ocean-grid  — 12-station Indian Ocean marine snapshot
GET  /api/v1/realtime/live-feed   — 1-second high-frequency telemetry stream
GET  /api/v1/realtime/status      — Cache age & data source health
```

### Historical & Registry Endpoints
```
GET  /api/v1/cyclones             — IBTrACS storm list (filter: basin, year, intensity, name)
GET  /api/v1/cyclones/{id}        — Full track + metrics for one cyclone
GET  /api/v1/models               — ML model registry with benchmark metrics
POST /api/v1/satellite/upload     — Ingest & store a satellite image
GET  /health                      — Component health (DB + model status)
```

---

## 🗂️ Project Structure

```
SIH-Project/
├── ai/                          # PyTorch Models, Training & XAI
│   ├── models/
│   │   ├── detection_model.py   # EfficientNet-B0 Binary Classifier
│   │   ├── classification_model.py # ResNet50 5-Class Classifier
│   │   ├── intensity_model.py   # CNN+LSTM Wind/Pressure Regressor
│   │   ├── track_model.py       # Seq2Seq LSTM Path Forecaster
│   │   └── fusion_model.py      # Late Fusion MLP
│   ├── inference/predictor.py   # Unified CyclonePredictor entry point
│   ├── preprocessing/           # Image normalization & augmentation
│   ├── datasets/                # HURSAT-B1 & IBTrACS data loaders
│   ├── xai/gradcam.py           # Grad-CAM heatmap engine
│   └── requirements.txt
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── api/v1/              # REST API Endpoints
│   │   │   ├── analyze.py       # Unified pipeline endpoint
│   │   │   ├── detection.py     # Binary detection
│   │   │   ├── classification.py # Pattern classification
│   │   │   ├── prediction.py    # Intensity & track
│   │   │   ├── realtime.py      # GDACS + Open-Meteo live feeds
│   │   │   ├── cyclones.py      # IBTrACS historical API
│   │   │   ├── satellite.py     # Satellite image upload & metadata
│   │   │   ├── models.py        # Model registry
│   │   │   └── health.py        # Health check
│   │   ├── core/config.py       # Pydantic settings (env-driven)
│   │   ├── database/            # SQLAlchemy ORM + seeders
│   │   ├── models/cyclone.py    # ORM models
│   │   ├── schemas/cyclone.py   # Pydantic request/response schemas
│   │   ├── services/realtime_service.py # GDACS/Open-Meteo fetchers + cache
│   │   ├── ml/model_manager.py  # Singleton model loader
│   │   └── main.py              # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/                    # Next.js 14 Web Application
│   ├── app/                     # App Router pages
│   │   ├── page.tsx             # Dashboard
│   │   ├── detection/           # Cyclone detection UI
│   │   ├── satellite/           # AI satellite analysis + Grad-CAM
│   │   ├── prediction/          # Track & intensity forecasting
│   │   ├── live-satellite/      # Live storm feed hub
│   │   ├── map/                 # Interactive Leaflet GIS map
│   │   ├── historical/          # IBTrACS catalog
│   │   ├── performance/         # Model benchmarks & charts
│   │   ├── methodology/         # ML methodology docs
│   │   └── about/               # Project info & disclaimer
│   ├── components/
│   │   ├── layout/Navbar.tsx    # Sticky navbar with MoES banner
│   │   ├── layout/Footer.tsx    # Footer (Dashboard only)
│   │   ├── ui/DataTypeBadge.tsx # OBSERVED/HISTORICAL/PREDICTED badges
│   │   ├── ui/LiveTickerBar.tsx # 1-second telemetry ticker
│   │   └── map/CycloneMap.tsx   # Leaflet map wrapper
│   ├── services/                # Axios API client services
│   ├── types/index.ts           # TypeScript type definitions
│   └── package.json
│
├── data/                        # Raw / processed data directory
├── models/                      # Trained .pth weight files (gitignored)
├── docs/                        # Technical documentation
├── docker-compose.yml           # 4-service orchestration
├── render.yaml                  # Render cloud deployment
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Option 1: Manual Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Prince-Nigam/Cyclone-AI.git
cd Cyclone-AI
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

# Start backend (auto-seeds DB with sample cyclones)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend runs at **http://localhost:8000** · Swagger docs at **http://localhost:8000/docs**

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

---

### Option 2: Docker Compose (Full Stack)
```bash
docker-compose up --build
```
- **Frontend:** http://localhost:3000
- **Backend + Swagger:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Application
APP_ENV=development
DEBUG=True

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite:///./cyclone_demo.db
# DATABASE_URL=postgresql://user:password@localhost:5432/cyclone_db

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ML Models (optional — demo mode runs without weights)
MODEL_BASE_PATH=./models
INFERENCE_DEVICE=cpu

# File Upload
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./data/uploads

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

**Frontend** (`.env.local` in `frontend/`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Cyclone AI — SIH
```

---

## 📊 Data Sources

| Source | Type | Usage |
|:---|:---|:---|
| [GDACS RSS](https://www.gdacs.org/xml/rss.xml) | 🟢 OBSERVED | Live active cyclone alerts on Dashboard & Live Feed |
| [Open-Meteo Marine](https://open-meteo.com) | 🟢 OBSERVED | 12-station Indian Ocean marine grid; point weather queries |
| [NASA GIBS WMTS](https://gibs.earthdata.nasa.gov) | 🟢 OBSERVED | MODIS/VIIRS satellite tile layers on Map & Live Feed |
| [Windy.com](https://www.windy.com) | 🟢 OBSERVED | Wind streamlines on Live Satellite page (embedded) |
| [IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive) | 🔵 HISTORICAL | Best-track archive, training labels, Historical catalog |
| [HURSAT-B1](https://www.ncei.noaa.gov/products/hursat) | 🔵 HISTORICAL | Satellite IR images for detection/classification training |
| INSAT-3D / Kalpana-1 | 🔵 HISTORICAL | Multi-source fusion encoder (second branch) |

---

## 🛠️ Technology Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 14.2.5 (App Router), React 18, TypeScript 5.3 |
| **Styling** | Tailwind CSS 3.4, custom CSS design tokens |
| **Charts** | Recharts 2.10 |
| **Maps** | Leaflet 1.9 + react-leaflet 4.2 |
| **State** | Zustand 4.5 |
| **HTTP Client** | Axios 1.6 |
| **Icons** | lucide-react 0.312 |
| **Backend** | FastAPI (Python 3.10+) |
| **ORM** | SQLAlchemy 2.0 |
| **Validation** | Pydantic v2 + pydantic-settings |
| **Database (dev)** | SQLite |
| **Database (prod)** | PostgreSQL 15 |
| **Cache** | Redis 7 (optional) |
| **ML Framework** | PyTorch 2.1 + torchvision |
| **CNN Backbones** | EfficientNet-B0, ResNet50 (ImageNet pretrained) |
| **Deployment** | Docker Compose (local) · Render (backend) · Vercel (frontend) |

---

## 📖 Documentation

| Document | Description |
|:---|:---|
| [docs/API.md](docs/API.md) | Complete REST API endpoint reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & component interaction |
| [docs/ML_METHODOLOGY.md](docs/ML_METHODOLOGY.md) | Deep learning architectures & loss functions |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Data ingestion pipeline details |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | Scientific constraints & operational boundaries |
| [docs/MULTI_SOURCE_FUSION.md](docs/MULTI_SOURCE_FUSION.md) | Late fusion strategy |

---

## 👤 Project Info

| Field | Detail |
|:---|:---|
| **Project Name** | Tropical Cyclone AI Platform |
| **Event** | Smart India Hackathon (SIH) 2026 |
| **Organization** | Ministry of Earth Sciences (MoES), Government of India |
| **Theme** | Disaster Management / AI & Space Weather Applications |
| **Category** | Software |
| **Author / Lead** | Prince Nigam · [@Prince-Nigam](https://github.com/Prince-Nigam) |
| **Repository** | [Prince-Nigam/Cyclone-AI](https://github.com/Prince-Nigam/Cyclone-AI) |
| **Live Demo** | [cyclone-ai-sih.vercel.app](https://cyclone-ai-sih.vercel.app) |
| **License** | [MIT License](LICENSE) |

---

<div align="center">
  <sub>Built for Smart India Hackathon 2026 · Ministry of Earth Sciences · Advancing meteorological AI for disaster preparedness</sub>
</div>
