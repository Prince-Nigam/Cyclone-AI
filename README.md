# 🌀 Tropical Cyclone AI Platform

> **Smart India Hackathon (SIH) Project**
> AI/ML Based Tropical Cyclone Identification, Classification and Prediction Using Multi-Source Satellite Data

---

## ⚠️ Important Disclaimer

This is a **research and prototype platform** developed for the Smart India Hackathon. It is **NOT** an official weather warning or operational forecasting system. All predictions are clearly labeled as model outputs. This system does not guarantee cyclone predictions.

Data types are always labeled:
- 🟢 **OBSERVED** — actual satellite/sensor data
- 🔵 **HISTORICAL** — archived best-track records (IBTrACS)
- 🟡 **SIMULATED** — generated for demonstration
- 🔴 **PREDICTED** — AI/ML model output

---

## 📌 Problem Statement

> "To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data."

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🔍 Cyclone Detection | EfficientNet-B0 based binary detection from satellite images |
| 🏷️ Pattern Classification | ResNet50 based intensity classification (TD/TS/CAT1/CAT2/CAT3+) |
| 📈 Intensity Prediction | CNN+LSTM regression for wind speed and pressure |
| 🗺️ Track Prediction | Seq2Seq LSTM for future cyclone path (24h/48h/72h) |
| 🛰️ Multi-Source Fusion | Feature-level fusion from HURSAT + INSAT data |
| 🔥 Explainable AI | Grad-CAM heatmaps showing model attention |
| 🗺️ Interactive Map | Leaflet-based historical + predicted track visualization |
| 📊 Model Performance | Real evaluation metrics dashboard |
| 📁 Historical Analysis | Browse and analyze past cyclone events |
| 🌐 REST API | FastAPI backend with full API documentation |

---

## 🏗️ System Architecture

```
MULTI-SOURCE SATELLITE DATA (HURSAT-B1, INSAT-3D, IBTrACS)
                    │
                    ▼
         DATA INGESTION LAYER
                    │
                    ▼
         DATA PREPROCESSING
      (resize, normalize, align)
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    DETECTION  CLASSIFICATION  FEATURE
      MODEL       MODEL       EXTRACTOR
  (EfficientB0) (ResNet50)   (CNN Enc.)
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────┼──────────┐
         ▼                     ▼
  INTENSITY PREDICT      TRACK PREDICT
   (CNN + LSTM)         (Seq2Seq LSTM)
         │                     │
         └──────────┬──────────┘
                    │
              XAI LAYER (Grad-CAM)
                    │
              FastAPI BACKEND
                    │
            ┌───────┴───────┐
            ▼               ▼
       PostgreSQL      File Storage
        Database         (images)
                    │
           Next.js FRONTEND
```

---

## 🛰️ Data Sources

| Source | Type | Use |
|--------|------|-----|
| IBTrACS | Best-track CSV | Labels, track data, intensity |
| HURSAT-B1 | IR Satellite Images (NetCDF) | Detection, classification training |
| INSAT-3D | Multi-channel HDF5 | Indian Ocean fusion (optional) |
| Himawari-8 | 16-band imagery | Asia-Pacific coverage (optional) |

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for detailed documentation.

---

## 🤖 AI/ML Methodology

### Detection
- Model: EfficientNet-B0 (ImageNet pretrained, fine-tuned)
- Input: 224×224 IR satellite image patch
- Output: Binary (cyclone/no-cyclone) + confidence

### Classification
- Model: ResNet50 (transfer learning)
- Classes: TD, TS, CAT1, CAT2, CAT3+ (Saffir-Simpson scale)
- Labels derived from IBTrACS `usa_wind` field

### Intensity Prediction
- Model: CNN Feature Extractor → LSTM(128) → Dense regression
- Input: Image features + historical wind/pressure sequence
- Output: Wind speed (kt), Pressure (hPa)

### Track Prediction
- Model: Seq2Seq LSTM (Encoder-Decoder)
- Input: Last 8 time steps [lat, lon, wind, pressure]
- Output: Next 8 time steps [lat, lon] (24h horizon)

See [docs/ML_METHODOLOGY.md](docs/ML_METHODOLOGY.md) for full details.

---

## 🗂️ Project Structure

```
tropical-cyclone-ai/
├── ai/                    # ML models, training, inference
│   ├── preprocessing/     # Image processing pipeline
│   ├── datasets/          # PyTorch Dataset classes
│   ├── models/            # Model architectures
│   ├── training/          # Training scripts
│   ├── evaluation/        # Evaluation and metrics
│   ├── inference/         # Inference pipeline
│   ├── xai/               # Explainable AI (Grad-CAM)
│   └── notebooks/         # Jupyter exploration notebooks
├── backend/               # FastAPI REST API
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── core/          # Config, logging, security
│   │   ├── database/      # SQLAlchemy setup
│   │   ├── models/        # ORM models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── ml/            # ML inference wrappers
│   │   └── utils/         # Utility functions
│   └── tests/
├── frontend/              # Next.js web dashboard
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── services/          # API client
│   └── types/             # TypeScript types
├── data/                  # Data directory (not committed)
├── models/                # Trained model weights (not committed)
├── docs/                  # Documentation
└── docker-compose.yml
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 15+
- (Optional) CUDA-capable GPU for faster training

### 1. Clone & Setup

```bash
git clone https://github.com/your-team/tropical-cyclone-ai.git
cd tropical-cyclone-ai
cp .env.example .env
# Edit .env with your credentials
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Create database
createdb cyclone_db

# Run migrations
cd backend
python -m app.database.init_db
```

### 4. AI/ML Setup

```bash
cd ai
pip install -r requirements.txt

# Download sample data (see docs/DATASET.md)
python datasets/download_samples.py
```

### 5. Frontend Setup

```bash
cd frontend
npm install
```

---

## 🚀 Running Locally

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### Using Docker

```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📡 API Documentation

Key endpoints:

```
GET  /health                        → System health check
GET  /api/v1/models                 → Available models info
POST /api/v1/detection/predict      → Cyclone detection
POST /api/v1/classification/predict → Pattern classification
POST /api/v1/intensity/predict      → Intensity prediction
POST /api/v1/track/predict          → Track prediction
POST /api/v1/analyze                → Unified analysis
GET  /api/v1/cyclones               → List historical cyclones
GET  /api/v1/cyclones/{id}          → Cyclone details
POST /api/v1/satellite/upload       → Upload satellite image
```

Full docs: [docs/API.md](docs/API.md) or `/docs` when server is running.

---

## 🚢 Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Railway / Render |
| Database | Railway PostgreSQL |
| ML Models | Backend inference service |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for deployment architecture.

---

## ⚠️ Limitations

- Training data limited to HURSAT-B1 historical archive (1978–2015)
- No real-time satellite feed in prototype phase
- Model accuracy depends on training data quality and size
- Track prediction horizon limited to 24–72 hours
- Not validated against operational forecast standards

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for complete list.

---

## 🔮 Future Scope

- Real-time INSAT-3DR feed (MOSDAC API)
- Physics-informed neural networks (PINN)
- Ensemble model predictions
- Uncertainty quantification
- ERA5 reanalysis integration
- Mobile PWA application
- Automated alert system

---

## 👥 Team

Smart India Hackathon 2024 — Team [Your Team Name]

---

## 📄 License

MIT License — See LICENSE file for details.

> This project is a research prototype. Not for operational use.
