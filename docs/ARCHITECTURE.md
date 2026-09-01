# 🏗️ System Architecture Documentation

> Tropical Cyclone AI Platform — Architecture Overview

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   MULTI-SOURCE SATELLITE DATA                     │
│    IBTrACS CSV  │  HURSAT-B1 NetCDF  │  INSAT-3D HDF5           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA INGESTION LAYER                          │
│  Download → Validate → Extract Metadata → Store → Index          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA PREPROCESSING                             │
│  Read NetCDF → Extract IR → Resize 224×224 → Normalize [0,1]    │
│  Handle NaN → Align timestamps → Assign IBTrACS labels           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │  DETECTION   │ │CLASSIFIC.│ │   FEATURE    │
    │  MODEL       │ │  MODEL   │ │  EXTRACTOR   │
    │ EfficientB0  │ │ ResNet50 │ │  CNN Encoder │
    │ Binary Cls.  │ │ 5-class  │ │  512-dim vec │
    └──────┬───────┘ └────┬─────┘ └──────┬───────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │    FUSION LAYER        │
             │  Concatenate features  │
             │  from multiple sources │
             └────────────┬───────────┘
                          │
              ┌───────────┼───────────┐
              │                       │
              ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ INTENSITY PRED.  │   │  TRACK PRED.     │
    │ CNN + LSTM       │   │  Seq2Seq LSTM    │
    │ wind, pressure   │   │  lat/lon 24-72h  │
    └──────────────────┘   └──────────────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │      XAI LAYER         │
             │  Grad-CAM heatmaps     │
             │  Attention maps        │
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │   FastAPI BACKEND      │
             │   REST API v1          │
             │   CORS + Validation    │
             └────────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
   ┌──────────────────┐    ┌──────────────────────┐
   │   PostgreSQL     │    │    File Storage       │
   │   Database       │    │    (images, models)   │
   │  Cyclone records │    │    ./data/  ./models/ │
   │  Predictions     │    └──────────────────────┘
   │  Observations    │
   └──────────────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │   Next.js FRONTEND     │
             │   TypeScript + Tailwind│
             └────────────┬───────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │   MAP    │   │ IMAGES   │   │  ANALYTICS   │
    │ Leaflet  │   │ Viewer   │   │  Recharts    │
    │ Track    │   │ Grad-CAM │   │  Metrics     │
    └──────────┘   └──────────┘   └──────────────┘
```

---

## 2. Component Details

### 2.1 Data Ingestion Layer

**Location**: `ai/datasets/`

**Responsibilities**:
- Download IBTrACS CSV files from NOAA
- Download HURSAT-B1 NetCDF files per storm
- Validate file integrity (checksum, format)
- Extract metadata (satellite, timestamp, coordinates)
- Store in structured `data/` directory

**Key Files**:
- `ai/datasets/ibtracs_loader.py`
- `ai/datasets/hursat_dataset.py`
- `ai/datasets/download_samples.py`

---

### 2.2 Preprocessing Pipeline

**Location**: `ai/preprocessing/`

**Responsibilities**:
- Read NetCDF satellite images
- Extract brightness temperature channel
- Crop/resize to 224×224
- Normalize pixel values to [0,1]
- Handle missing values (NaN fill)
- Match image timestamps to IBTrACS records
- Apply augmentation during training

**Key Files**:
- `ai/preprocessing/image_processor.py`
- `ai/preprocessing/data_validator.py`
- `ai/preprocessing/augmentation.py`

---

### 2.3 ML Models

**Location**: `ai/models/`

| Model | Architecture | Task | Input | Output |
|-------|-------------|------|-------|--------|
| Detection | EfficientNet-B0 | Binary classification | 224×224 IR image | {detected, confidence} |
| Classification | ResNet50 | Multi-class | 224×224 IR image | {class, confidence} |
| Intensity | CNN + LSTM | Regression | Features + sequence | {wind_kt, pressure_hPa} |
| Track | Seq2Seq LSTM | Sequence prediction | 8 past [lat,lon,wind,pres] | 8 future [lat,lon] |
| Fusion | MLP | Feature combination | Multiple feature vectors | Unified features |

---

### 2.4 XAI Layer

**Location**: `ai/xai/`

**Method**: Grad-CAM (Gradient-weighted Class Activation Mapping)

**Process**:
1. Forward pass through detection/classification model
2. Register hook on last convolutional layer
3. Backward pass for target class
4. Compute weighted combination of gradients × activations
5. Resize to input image size
6. Overlay heatmap on original image

---

### 2.5 Backend (FastAPI)

**Location**: `backend/`

**Architecture Pattern**: Service Layer Pattern

```
HTTP Request
    │
    ▼
API Router (api/v1/)
    │
    ▼
Request Validation (Pydantic schemas)
    │
    ▼
Service Layer (services/)
    │
    ├── ML Inference (ml/)
    │       │
    │       └── Model Loaders → PyTorch models
    │
    └── Database Operations (database/)
            │
            └── SQLAlchemy ORM → PostgreSQL
    │
    ▼
Response (Pydantic schemas)
    │
    ▼
HTTP Response
```

---

### 2.6 Database

**Engine**: PostgreSQL 15

**ORM**: SQLAlchemy 2.0

**Tables**:
- `cyclones` — Master cyclone records
- `track_points` — Position/intensity at each time step
- `satellite_observations` — Image metadata
- `predictions` — ML model predictions
- `ml_models` — Model registry
- `evaluation_results` — Training metrics

---

### 2.7 Frontend (Next.js)

**Location**: `frontend/`

**Architecture**: Next.js 14 App Router

**Key Libraries**:
- `leaflet` + `react-leaflet` — Interactive map
- `recharts` — Charts and analytics
- `tailwindcss` — Styling
- `axios` — API client
- `zustand` — State management

**Pages**:
```
/ → Dashboard (overview)
/detection → Upload + detect cyclone
/classification → Pattern classification
/prediction → Intensity + track prediction
/map → Interactive cyclone map
/satellite → Satellite image viewer
/historical → Historical cyclone explorer
/performance → Model performance metrics
/methodology → Technical explanation
/about → Project info
```

---

## 3. ML Pipeline Flow

```
TRAINING PIPELINE:
  IBTrACS CSV ──→ Parse records ──→ Filter by basin
       │
  HURSAT-B1 ──→ Download per storm ──→ Read NetCDF
       │
  Match by StormID + Timestamp
       │
  Assign label (TD/TS/CAT1/2/3+)
       │
  Train/Val/Test split (by cyclone event, not random)
       │
  PyTorch Dataset + DataLoader
       │
  Train EfficientNet-B0 (detection)
  Train ResNet50 (classification)
  Train CNN+LSTM (intensity)
  Train Seq2Seq LSTM (track)
       │
  Evaluate on test set
       │
  Save: weights + config + metrics
       │
  Export for inference

INFERENCE PIPELINE:
  Input image
       │
  Preprocess (224×224, normalize)
       │
  Detection model → cyclone/no-cyclone + confidence
       │ (if detected)
  Classification model → intensity class + confidence
       │
  Feature extractor → feature vector
       │
  Intensity model → wind (kt), pressure (hPa)
       │
  Track model → future lat/lon sequence
       │
  Grad-CAM → attention heatmap
       │
  Return unified JSON response
```

---

## 4. Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Vercel       │────▶│    Railway      │────▶│  Railway DB     │
│  Next.js App    │     │  FastAPI App    │     │  PostgreSQL     │
│  CDN edge       │     │  ML Inference   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                        ┌───────┴────────┐
                        │  File Storage  │
                        │  ./data/       │
                        │  ./models/     │
                        └────────────────┘
```

---

## 5. Data Flow for Single Analysis Request

```
User uploads satellite image
         │
         ▼
Frontend validates (format, size)
         │
         ▼
POST /api/v1/analyze (multipart form)
         │
         ▼
Backend validates image
         │
         ▼
Image → Preprocessing → Tensor
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Detection  Classification
Model      Model
    │         │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Intensity  Track
Model      Model
    │         │
    └────┬────┘
         │
         ▼
    Grad-CAM XAI
         │
         ▼
    Save to DB (prediction record)
         │
         ▼
    Return unified JSON
         │
         ▼
Frontend renders:
  - Detection result
  - Classification
  - Intensity values
  - Track on map
  - Heatmap overlay
```

---

*Document version: 1.0*
*Last updated: 2024*
