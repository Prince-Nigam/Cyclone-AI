# 🌀 Tropical Cyclone AI Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/AI%2FML-PyTorch%202.1-EE4C2C?style=for-the-badge&logo=pytorch)](https://pytorch.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Smart India Hackathon (SIH) Project**  
*AI/ML-Powered Tropical Cyclone Identification, Saffir-Simpson Pattern Classification, 24h Track & Intensity Forecasting, and Real-Time Multi-Source Satellite Telemetry Hub.*

[🌐 Live Web Demo](https://cyclone-ai-sih.vercel.app) • [📖 Technical Docs](docs/)

</div>

---

## 📌 Problem Statement

> *"To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."*

Cyclones in the North Indian Ocean (Arabian Sea and Bay of Bengal) pose severe humanitarian and economic threats. Conventional numerical weather prediction (NWP) models require massive supercomputing clusters and often face latency delays. The **Tropical Cyclone AI Platform** leverages deep neural networks trained on decades of satellite and track records to provide **sub-second inference**, **explainable visual heatmaps (Grad-CAM)**, and **real-time global telemetry fusion**.

---

## ⚠️ Important Disclaimer & Data Provenance

> [!WARNING]
> **Research Prototype Notice**: This system is developed as an AI/ML research prototype for the Smart India Hackathon. It is **NOT** an official operational meteorological warning service. For official emergency alerts, storm advisories, and evacuations in India, always consult the **[India Meteorological Department (IMD)](https://mausam.imd.gov.in)**.

Every metric, visualization, and prediction across the platform is explicitly labeled with its data provenance:
- 🟢 **OBSERVED** — Live real-world observational telemetry (GDACS active RSS alerts, Open-Meteo ocean grid, NASA GIBS satellite feeds).
- 🔵 **HISTORICAL** — Curated best-track climatological archives (IBTrACS 1978–2015, HURSAT-B1).
- 🔴 **PREDICTED** — Neural network model inference outputs (EfficientNet, ResNet50, CNN+LSTM, Seq2Seq).
- 🟡 **SIMULATED** — Synthetic evaluation runs when offline or running in mock demonstration mode.

---

## 🎯 Key Features & Platform Modules

| Module | Route | Capabilities & Models Used | Status |
| :--- | :--- | :--- | :---: |
| 🏠 **Dashboard** | `/` | Real-time global storm summary, Earth Projection Cyclone Hero, 1-second live telemetry stream, key statistics, and system architecture. | 🟢 Active |
| 🔍 **Detection** | `/detection` | Binary cyclone detection (`Cyclone` vs `No Cyclone`) from satellite IR imagery with in-box preview, paste support (Ctrl+V), and confidence score. | 🟢 Active |
| 🛰️ **Satellite Viewer** | `/satellite` | Unified multi-format image analysis (`PNG`, `JPG`, `TIFF`, `NetCDF .nc`, `HDF5 .h5`) with **Grad-CAM XAI explainability heatmaps**. | 🟢 Active |
| 📈 **Track & Intensity** | `/prediction` | **Seq2Seq LSTM** 24-hour future trajectory forecasting (3h steps) & **CNN+LSTM** numerical wind speed (kt) and central pressure (hPa) regression. | 🟢 Active |
| 🌐 **Live Satellite Hub** | `/live-satellite` | Real-time **GDACS** active global cyclone tracker, **NASA GIBS** true-color satellite tiles, **Windy.com** streamlines, and 12-station Indian Ocean marine grid. | 🟢 Active |
| 🗺️ **Interactive GIS Map** | `/map` | Fullscreen Leaflet map displaying historical best-tracks, real-time storm coordinates, wind radii, and satellite layer toggles. | 🟢 Active |
| 📂 **Historical Catalog** | `/historical` | Searchable **IBTrACS** database (1978–2015) filtered by basin (`NI`, `SI`, `WP`, `NA`, etc.), storm name, year, and peak intensity metrics. | 🟢 Active |
| 📊 **Performance Portal** | `/performance` | ML Model Registry, per-class Precision/Recall, $5\times5$ Confusion Matrix, ROC/PR Curves, and Training Convergence loss plots. | 🟢 Active |
| 📖 **Methodology & About**| `/methodology` • `/about` | Technical mathematical formulations, multi-source feature fusion strategies, temporal validation splits, and platform details. | 🟢 Active |

---

## 🤖 Deep Learning Model Registry & Benchmarks

The AI pipeline is evaluated on held-out test splits from the **HURSAT-B1** and **IBTrACS** datasets:

```
┌─────────────────────────┬───────────────────────────────┬───────────────────────────────┬───────────────────────────┐
│ Task                    │ Architecture                  │ Primary Metric                │ Loss & Optimization       │
├─────────────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────┤
│ 1. Binary Detection     │ EfficientNet-B0 (1-ch IR)     │ Accuracy: 85.4% | F1: 0.851   │ BCE with Logits (AdamW)   │
│ 2. Pattern Classification│ ResNet50 (5 Classes)          │ Accuracy: 76.8% | F1: 0.748   │ Focal Loss (γ=2.0)        │
│ 3. Intensity Regression │ CNN + LSTM(128)               │ MAE: 8.32 kt  | R²: 0.835     │ Smooth L1 / Huber Loss    │
│ 4. Track Forecast (24h) │ Seq2Seq LSTM(256) (Encoder-Dec)│ MAE: 48.60 km | R²: 0.892     │ MSE Loss on (Δlat, Δlon) │
│ 5. Explainable AI (XAI) │ Grad-CAM (Target Conv Layer)  │ Class Activation Heatmaps     │ Base64 Alpha Overlay      │
│ 6. Multi-Source Fusion  │ Multi-Branch MLP (256-dim)    │ Late Fusion Classification    │ Cross-Entropy             │
└─────────────────────────┴───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

### Intensity Classification Categories (Saffir-Simpson Scale)
- **TD** — Tropical Depression ($< 34\text{ kt}$)
- **TS** — Tropical Storm ($34 - 63\text{ kt}$)
- **CAT1** — Category 1 Cyclone ($64 - 82\text{ kt}$)
- **CAT2** — Category 2 Cyclone ($83 - 95\text{ kt}$)
- **CAT3+** — Category 3+ Major Cyclone ($\ge 96\text{ kt}$)

---

## 🏗️ System Architecture & Data Flow

```
                      ┌────────────────────────────────────────────────────────┐
                      │              MULTI-SOURCE DATA INGESTION               │
                      ├──────────────────────────┬─────────────────────────────┤
                      │  Live Telemetry Streams  │   Climatological Archives   │
                      │  • GDACS Live RSS Feeds  │   • IBTrACS Global Tracks   │
                      │  • Open-Meteo 12-Buoy Grid│   • HURSAT-B1 Satellite IR │
                      │  • NASA GIBS Satellite   │   • INSAT-3D & Kalpana-1    │
                      └────────────┬─────────────┴──────────────┬──────────────┘
                                   │                            │
                                   ▼                            ▼
                      ┌────────────────────────────────────────────────────────┐
                      │              FASTAPI BACKEND & AI PIPELINE             │
                      ├────────────────────────────────────────────────────────┤
                      │ • Image Normalization (224×224 IR, Multi-Format Loader)│
                      │ • PyTorch Model Manager & Inference Pipeline           │
                      │    ├── EfficientNet-B0 ──> Binary Cyclone Detector     │
                      │    ├── ResNet50 ─────────> 5-Class Intensity Pattern   │
                      │    ├── CNN + LSTM ───────> Wind Speed (kt) & Pressure  │
                      │    ├── Seq2Seq LSTM ─────> 24h Future Path (3h Steps)  │
                      │    └── Grad-CAM Engine ──> Visual Explainability Map   │
                      │ • 1-Second Live Stream Engine & Caching Service        │
                      │ • SQLAlchemy 2.0 ORM (PostgreSQL / SQLite Database)    │
                      └────────────────────────────┬───────────────────────────┘
                                                   │
                                                   ▼
                      ┌────────────────────────────────────────────────────────┐
                      │            NEXT.JS 16 FRONTEND (APP ROUTER)            │
                      ├────────────────────────────────────────────────────────┤
                      │ • Responsive Glassmorphism Design & Dark/Light Themes  │
                      │ • Interactive In-Box Satellite Upload & Direct Paste   │
                      │ • Leaflet Interactive GIS Mapping & Satellite Tiles    │
                      │ • Live 1-Second Telemetry Ticker & Real-Time Alerts    │
                      │ • Comprehensive Model Registry & Confusion Matrix      │
                      └────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Directory Structure

```
Cyclone-AI/
├── ai/                              # PyTorch Models, Training & Evaluation
│   ├── datasets/                    # HURSAT-B1, IBTrACS & synthetic data loaders
│   ├── evaluation/                  # Metric computation (Accuracy, F1, MAE, ROC)
│   ├── inference/
│   │   └── predictor.py             # Unified end-to-end CyclonePredictor
│   ├── models/                      # Neural network architecture definitions
│   │   ├── detection_model.py       # EfficientNet-B0 Binary Classifier
│   │   ├── classification_model.py  # ResNet50 Saffir-Simpson Classifier
│   │   ├── intensity_model.py       # CNN+LSTM Wind/Pressure Regressor
│   │   ├── track_model.py           # Seq2Seq LSTM Path Forecaster
│   │   └── fusion_model.py          # Multi-Source Late Fusion MLP
│   ├── preprocessing/               # Image normalization & augmentation scripts
│   ├── xai/
│   │   └── gradcam.py               # Grad-CAM explainability heatmap visualizer
│   └── requirements.txt
├── backend/                         # FastAPI High-Performance Backend
│   ├── app/
│   │   ├── api/v1/                  # REST API Endpoints
│   │   │   ├── analyze.py           # Unified Pipeline (Detection + Class + Track + XAI)
│   │   │   ├── detection.py         # Binary detection endpoint
│   │   │   ├── classification.py    # Pattern classification endpoint
│   │   │   ├── prediction.py        # Intensity & track prediction endpoint
│   │   │   ├── realtime.py          # GDACS RSS, 12-buoy ocean grid & 1s stream
│   │   │   ├── cyclones.py          # Historical IBTrACS archive & tracks
│   │   │   ├── models.py            # Model registry & benchmark metrics
│   │   │   └── satellite.py         # Satellite image upload & metadata
│   │   ├── core/                    # App configuration, logging & security
│   │   ├── database/                # SQLAlchemy database connection & seeders
│   │   ├── models/                  # SQLAlchemy ORM database models
│   │   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   └── services/                # Background live fetchers & caching
│   ├── main.py                      # FastAPI app entry point & lifespans
│   └── requirements.txt
├── frontend/                        # Next.js 16 Web Application (App Router)
│   ├── app/                         # App Router Pages
│   │   ├── detection/page.tsx       # Cyclone detection with in-box preview
│   │   ├── satellite/page.tsx       # Unified multi-format satellite analysis
│   │   ├── prediction/page.tsx      # Trajectory & intensity forecasting
│   │   ├── live-satellite/page.tsx  # Live storm feeds, Windy & Ocean Grid
│   │   ├── map/page.tsx             # Interactive Leaflet GIS map
│   │   ├── historical/page.tsx      # IBTrACS historical storm catalog
│   │   ├── performance/page.tsx     # Model benchmarks, confusion matrix & curves
│   │   ├── methodology/page.tsx     # Scientific methodology documentation
│   │   ├── about/page.tsx           # Platform info & provenance disclaimer
│   │   ├── page.tsx                 # Dashboard with Earth Projection Hero
│   │   └── layout.tsx               # Root layout, Navbar & research banner
│   ├── components/                  # Reusable UI & Layout Components
│   │   ├── analysis/                # Analysis panels, meters & CAM visualizers
│   │   ├── layout/                  # Navbar, Footer & Navigation
│   │   ├── map/                     # Leaflet map wrapper & satellite layers
│   │   └── ui/                      # Badges, LiveTicker, Charts & Buttons
│   ├── services/                    # Axios API client services
│   ├── types/                       # TypeScript interfaces & type definitions
│   └── package.json
├── docs/                            # In-Depth Technical Documentation
│   ├── API.md                       # Full REST API specification
│   ├── ARCHITECTURE.md              # System design & component interaction
│   ├── DATA_SOURCES.md              # Ingested datasets & live feeds
│   ├── LIMITATIONS.md               # Scientific constraints & operational bounds
│   ├── ML_METHODOLOGY.md            # Deep learning architectures & loss functions
│   └── MULTI_SOURCE_FUSION.md       # Multi-sensor late fusion strategy
├── docker-compose.yml               # Multi-container orchestration
├── render.yaml                      # Render deployment specification
└── README.md                        # Master Project Documentation
```

---

## 📡 REST API Reference

The FastAPI backend automatically generates interactive Swagger OpenAPI documentation available at **`/docs`** (or ReDoc at **`/redoc`**).

### Real-Time Telemetry Endpoints
- `GET /api/v1/realtime/cyclones` — Fetch active global cyclones from GDACS RSS feed (supports `?indian_ocean_only=true`).
- `GET /api/v1/realtime/weather?lat=15.5&lon=72.0` — Surface weather, sea temperature, and wind at specific coordinates.
- `GET /api/v1/realtime/ocean-grid` — Real-time telemetry for 12 marine stations across Arabian Sea & Bay of Bengal.
- `GET /api/v1/realtime/live-feed` — High-frequency 1-second telemetry stream with instant gust calculations.
- `GET /api/v1/realtime/status` — Data source health, cache age, and connectivity status.

### AI Inference & Forecasting Endpoints
- `POST /api/v1/analyze` — **Unified AI Pipeline**: Upload image $\rightarrow$ Detection $\rightarrow$ Classification $\rightarrow$ Intensity $\rightarrow$ Track $\rightarrow$ Grad-CAM.
- `POST /api/v1/detection/predict` — EfficientNet-B0 binary cyclone classification.
- `POST /api/v1/classification/predict` — ResNet50 5-class intensity pattern classification.
- `POST /api/v1/intensity/predict` — CNN+LSTM numerical wind speed and pressure estimation.
- `POST /api/v1/track/predict` — Seq2Seq LSTM 24-hour future track trajectory forecast.
- `GET /api/v1/models` — Registered model registry, status (`loaded`), and benchmark metrics.

### Historical Climatology Endpoints
- `GET /api/v1/cyclones` — Query historical IBTrACS storms by basin (`NI`, `SI`, `WP`, `NA`), name, year, or intensity.
- `GET /api/v1/cyclones/{id}` — Retrieve complete track trajectory, peak wind speed, pressure, and timestamps.
- `POST /api/v1/satellite/upload` — Ingest satellite imagery for processing and database storage.

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher (`npm` or `yarn`)
- **Git**

---

### Option 1: Manual Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Prince-Nigam/Cyclone-AI.git
cd Cyclone-AI
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Initialize & Seed Database (Sample Cyclones + Model Benchmarks)
python -m app.database.init_db

# Run FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Backend will be running at [http://localhost:8000](http://localhost:8000) (Swagger Docs at `/docs`).*

#### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend will be running at [http://localhost:3000](http://localhost:3000).*

---

### Option 2: Run with Docker Compose

Run the entire full-stack platform (FastAPI + Next.js) with a single command:
```bash
docker-compose up --build
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server & Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the root or `backend/` directory (see `.env.example`):

```env
# Application Settings
PROJECT_NAME="Tropical Cyclone AI Platform"
ENVIRONMENT="development"
DEBUG=True
API_V1_STR="/api/v1"

# Database Configuration (SQLite by default; PostgreSQL for production)
DATABASE_URL="sqlite:///./cyclone_ai.db"
# DATABASE_URL="postgresql://user:password@localhost:5432/cyclone_db"

# CORS Allowed Origins
CORS_ORIGINS=["http://localhost:3000","https://cyclone-ai-sih.vercel.app"]

# AI / ML Model Settings
MODELS_DIR="./models"
USE_MOCK_MODELS=False
DEVICE="cpu" # or "cuda"

# External Data Feeds
GDACS_RSS_URL="https://www.gdacs.org/xml/rss.xml"
OPEN_METEO_BASE_URL="https://marine-api.open-meteo.com/v1/marine"
NASA_GIBS_WMTS_URL="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi"
```

---

## 📖 In-Depth Technical Documentation

For comprehensive research methodologies, model architectures, and design documentation, explore the `docs/` folder:

- [📘 REST API Specification](docs/API.md) — Complete endpoint schemas, request parameters, and response bodies.
- [🏛️ System Architecture](docs/ARCHITECTURE.md) — Detailed microservice design, lifespan management, and caching layers.
- [🛰️ Data Sources & Ingestion](docs/DATA_SOURCES.md) — HURSAT-B1, IBTrACS, GDACS RSS, and Open-Meteo integration details.
- [🧠 Deep Learning Methodology](docs/ML_METHODOLOGY.md) — Loss functions, convolutional backbones, LSTM cells, and Grad-CAM math.
- [🔀 Multi-Source Sensor Fusion](docs/MULTI_SOURCE_FUSION.md) — Late fusion strategy combining multi-spectral satellite imagery.
- [⚠️ Limitations & Scientific Boundaries](docs/LIMITATIONS.md) — Meteorological limitations, resolution constraints, and safety guidelines.

---

## 👥 Smart India Hackathon (SIH)

- **Project**: Tropical Cyclone AI Platform (Cyclone AI)
- **Theme**: Disaster Management / AI & Space Weather Applications
- **Author / Lead**: Prince Nigam ([@Prince-Nigam](https://github.com/Prince-Nigam))
- **Repository**: [Prince-Nigam/Cyclone-AI](https://github.com/Prince-Nigam/Cyclone-AI)
- **License**: [MIT License](LICENSE)

<div align="center">
<sub>Built with ❤️ for the Smart India Hackathon. Dedicated to advancing meteorological AI research and disaster preparedness.</sub>
</div>
