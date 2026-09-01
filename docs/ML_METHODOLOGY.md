# 🤖 ML Methodology Documentation

> Tropical Cyclone AI Platform — Machine Learning Approach

---

## ⚠️ Scientific Disclaimer

All models in this system are **research prototypes**. Predictions are AI model outputs and should not be treated as operational weather forecasts. Accuracy depends on training data quality and size. All limitations are documented honestly.

---

## 1. Problem Formulation

### 1.1 Cyclone Detection
**Type**: Binary Image Classification  
**Input**: 224×224 infrared satellite image patch  
**Output**: P(cyclone present) ∈ [0, 1]  
**Threshold**: 0.5 (configurable)

### 1.2 Pattern Classification
**Type**: Multi-class Image Classification  
**Input**: 224×224 infrared satellite image  
**Output**: One of 5 intensity classes

### 1.3 Intensity Prediction
**Type**: Multi-output Regression  
**Input**: Image features + historical sequence  
**Output**: [wind_speed_kt, pressure_hPa]

### 1.4 Track Prediction
**Type**: Sequence-to-Sequence Regression  
**Input**: Last N time steps [lat, lon, wind, pressure]  
**Output**: Next N time steps [lat, lon]

---

## 2. Dataset

### 2.1 Primary Sources

| Dataset | Used For | Samples (approx.) |
|---------|----------|-------------------|
| HURSAT-B1 | Detection + Classification images | ~60,000 images |
| IBTrACS | Labels + Track/Intensity targets | ~4,000 storms |

### 2.2 Classification Labels

Labels are derived directly from IBTrACS `USA_SSHS` field (Saffir-Simpson Hurricane Wind Scale):

| Class Label | SSHS Code | Wind Speed Range | Description |
|------------|-----------|-----------------|-------------|
| `TD` | -5 | < 34 kt | Tropical Depression |
| `TS` | -4 | 34–63 kt | Tropical Storm |
| `CAT1` | 1 | 64–82 kt | Category 1 Hurricane |
| `CAT2` | 2 | 83–95 kt | Category 2 Hurricane |
| `CAT3_PLUS` | 3,4,5 | ≥ 96 kt | Category 3/4/5 (merged) |

> **Note**: CAT3, CAT4, CAT5 are merged into one class due to limited high-intensity samples in training data. This is documented as a limitation.

### 2.3 Geographic Focus

Primary focus: **North Indian Ocean Basin** (Bay of Bengal + Arabian Sea)
- Most relevant for SIH India context
- INSAT-3D coverage aligns with this region
- IBTrACS `BASIN = 'NI'` filter applied

Secondary: **All basins** (when using HURSAT global dataset)

---

## 3. Data Preprocessing

### 3.1 Image Preprocessing Pipeline

```python
# Step-by-step preprocessing
1. Read NetCDF file → extract IRWIN channel (brightness temp, K)
2. Handle NaN/fill values → replace with channel mean
3. Clip to valid range [180K, 330K] (physical IR range)
4. Resize to 224×224 using bilinear interpolation
5. Normalize: (value - mean) / std  [per-channel stats]
6. Convert to float32 tensor
```

### 3.2 Why 224×224?
- Standard input for ImageNet-pretrained models (EfficientNet, ResNet)
- Manageable memory footprint
- Preserves sufficient cyclone structure detail

### 3.3 Normalization Statistics
Computed from training set:
- Mean and std calculated per-channel from training images
- Applied consistently to validation and test sets
- Stored in `data/metadata/normalization_stats.json`

---

## 4. Train/Validation/Test Split

### 4.1 Strategy: Cyclone-Event Based Split

**NOT** random image splitting — this would cause data leakage (same cyclone in train and test).

```
IBTrACS storms sorted by start_year

Train: storms from 1978 to 2010  (~70%)
Val:   storms from 2011 to 2013  (~15%)
Test:  storms from 2014 to 2015  (~15%)
```

### 4.2 Why Event-Based?
- Images from the same cyclone are temporally correlated
- Random splitting would allow the model to "memorize" specific storms
- Time-aware split tests generalization to unseen storms

---

## 5. Data Augmentation

Applied **only during training**. NOT applied during validation/test.

| Augmentation | Parameters | Scientific Justification |
|-------------|-----------|--------------------------|
| Random horizontal flip | p=0.5 | Cyclones in both hemispheres rotate differently; horizontal mirror acceptable |
| Random rotation | ±15° | Small rotations preserve structure |
| Random brightness | ±10% | Sensor calibration variation |
| Random contrast | ±10% | Atmospheric condition variation |
| Random crop | 224→200→224 | Scale variation |

**NOT applied** (physically unrealistic):
- Vertical flip alone (destroys cyclone symmetry)
- Large rotations > 30°
- Color jitter > 20%
- Elastic deformations

---

## 6. Model Architecture

### 6.1 Detection Model

```
Architecture: EfficientNet-B0

Input: [B, 1, 224, 224]  (B = batch size, 1 channel for IR)
       │
EfficientNet-B0 backbone (ImageNet pretrained)
  └── Modified: first conv accepts 1 channel (IR)
       │
Global Average Pooling
       │
Dropout(0.3)
       │
Linear(1280 → 256)
ReLU
Dropout(0.2)
       │
Linear(256 → 1)
Sigmoid
       │
Output: [B, 1]  (probability of cyclone)
```

**Why EfficientNet-B0?**
- Compound scaling — better accuracy per FLOP
- 5.3M parameters — practical for CPU inference
- Strong ImageNet features transfer to satellite imagery

**Loss**: Binary Cross-Entropy  
**Optimizer**: AdamW (lr=1e-4, weight_decay=1e-4)  
**LR Scheduler**: CosineAnnealingLR  
**Epochs**: 50 (with early stopping, patience=10)

---

### 6.2 Classification Model

```
Architecture: ResNet50

Input: [B, 1, 224, 224]
       │
ResNet50 backbone (ImageNet pretrained)
  └── Modified: first conv accepts 1 channel
       │
Global Average Pooling
       │
Dropout(0.4)
       │
Linear(2048 → 512)
ReLU
Dropout(0.3)
       │
Linear(512 → 5)  ← 5 classes: TD/TS/CAT1/CAT2/CAT3+
       │
Output: [B, 5]  (class logits → softmax for probabilities)
```

**Loss**: CrossEntropyLoss (with class weights for imbalance)  
**Optimizer**: AdamW (lr=5e-5)  
**LR Scheduler**: StepLR (step=15, gamma=0.5)

---

### 6.3 Intensity Prediction Model

```
Architecture: CNN Feature Extractor + LSTM

Stage 1 - Feature Extraction:
  Input: [B, 1, 224, 224]
  EfficientNet-B0 (frozen backbone) → 512-dim feature vector

Stage 2 - Temporal Model:
  Input sequence: [B, T, 516]  (512 img features + 4 numeric: lat, lon, prev_wind, prev_pres)
  LSTM(input=516, hidden=256, layers=2, dropout=0.3)
  Linear(256 → 128)
  ReLU
  Linear(128 → 2)  ← [wind_kt, pressure_hPa]
  Output: [B, 2]
```

**Loss**: MSE Loss  
**Optimizer**: Adam (lr=1e-3)  
**Metrics**: MAE, RMSE, R²

---

### 6.4 Track Prediction Model

```
Architecture: Encoder-Decoder LSTM (Seq2Seq)

Input sequence: [B, 8, 4]  (8 time steps × [lat, lon, wind, pressure])

Encoder:
  LSTM(input=4, hidden=256, layers=2, dropout=0.2)
  Context vector: final hidden + cell state

Decoder:
  LSTM(input=2, hidden=256, layers=2, dropout=0.2)
  Linear(256 → 2)  ← [lat, lon]
  Output: [B, 8, 2]  (8 future positions)
```

**Teacher Forcing**: 0.5 during training  
**Loss**: MSE Loss on lat/lon  
**Metrics**: Mean Haversine Distance Error (km)  
**Prediction Horizon**: 8 steps × 3h interval = 24 hours

---

### 6.5 Multi-Source Fusion Model

```
Architecture: Late Feature Fusion MLP

Source A (HURSAT): Image → EfficientNet → feat_A [512]
Source B (INSAT):  Image → EfficientNet → feat_B [512]

Concatenate: [feat_A, feat_B] = [1024]
       │
MLP:
  Linear(1024 → 512)
  BatchNorm1d(512)
  ReLU
  Dropout(0.3)
  Linear(512 → 256)
  ReLU
  Linear(256 → num_classes)  or  Linear(256 → 2) for regression

```

**Fallback**: If only one source available, pass zero vector for missing source.

---

## 7. Training Infrastructure

### 7.1 Hardware Requirements
| Configuration | RAM | GPU | Training Time (est.) |
|--------------|-----|-----|---------------------|
| Minimum | 8 GB | None (CPU) | ~12h detection, ~24h classification |
| Recommended | 16 GB | 4GB VRAM | ~2h detection, ~4h classification |
| Optimal | 32 GB | 8GB+ VRAM | ~30min per model |

### 7.2 Training Configuration
```yaml
# Stored in models/{model}/config.yaml
model_version: v1
architecture: efficientnet_b0
training_date: 2024-XX-XX
dataset_version: hursat_ibtracs_v1
input_size: [224, 224]
channels: 1
batch_size: 32
epochs: 50
early_stopping_patience: 10
optimizer: adamw
learning_rate: 0.0001
weight_decay: 0.0001
scheduler: cosine_annealing
augmentation: true
```

---

## 8. Evaluation

### 8.1 Classification Metrics
- **Accuracy**: Overall correct predictions / total
- **Precision** (per class): TP / (TP + FP)
- **Recall** (per class): TP / (TP + FN)
- **F1 Score** (per class): 2 × (P × R) / (P + R)
- **Macro F1**: Unweighted mean of per-class F1
- **Confusion Matrix**: Actual vs predicted class

### 8.2 Regression Metrics (Intensity)
- **MAE**: Mean Absolute Error (kt or hPa)
- **RMSE**: Root Mean Square Error
- **R²**: Coefficient of determination

### 8.3 Track Metrics
- **Mean Distance Error (km)**: Average Haversine distance between predicted and actual positions
- **Per-step error**: Error at each prediction step (t+3h, t+6h, ..., t+24h)

---

## 9. Inference

### 9.1 Inference Pipeline

```python
def analyze(image_path: str) -> dict:
    # 1. Load and preprocess
    img = preprocess(image_path)  # → (1, 224, 224) tensor

    # 2. Detection
    det_result = detection_model(img)  # → {detected, confidence}

    if not det_result['detected']:
        return {'detected': False, 'message': 'No cyclone detected'}

    # 3. Classification
    cls_result = classification_model(img)  # → {class, confidence}

    # 4. Feature extraction
    features = feature_extractor(img)  # → (512,) vector

    # 5. Intensity prediction (if sequence available)
    intensity = intensity_model(features, history)  # → {wind, pressure}

    # 6. Track prediction (if history available)
    track = track_model(history)  # → [{lat, lon}, ...]

    # 7. Grad-CAM
    heatmap = gradcam(img, target_class=cls_result['class'])

    return {
        'detection': det_result,
        'classification': cls_result,
        'intensity': intensity,
        'track': track,
        'explainability': {'heatmap_b64': encode(heatmap)},
        'metadata': {'model_version': 'v1', 'data_type': 'PREDICTED'}
    }
```

### 9.2 Model Caching
- Models loaded once at startup
- Cached in memory for inference
- Version tracked in database

---

## 10. Limitations

1. **Training data**: HURSAT-B1 covers 1978–2015 only; recent storm patterns may differ
2. **Single channel**: Only IR channel used; VIS/WV channels could improve classification
3. **Class imbalance**: CAT3+ storms are rare; minority class performance may be lower
4. **Intensity accuracy**: Satellite-derived intensity has known limitations vs dropsonde data
5. **Track horizon**: 24h prediction; beyond 72h accuracy degrades significantly
6. **Indian Ocean bias**: Models trained on global data; fine-tuning on Bay of Bengal recommended
7. **No NWP integration**: Numerical Weather Prediction data not used; would improve accuracy
8. **Image resolution**: ~8 km HURSAT resolution is coarser than modern satellites

---

## 11. Future Improvements

1. Include WV and VIS channels (multi-channel input)
2. Fine-tune on Indian Ocean subset
3. Integrate ERA5 reanalysis as environmental features
4. Implement Physics-Informed Neural Network (PINN)
5. Ensemble multiple architectures (EfficientNet + ViT + ResNet)
6. Monte Carlo Dropout for uncertainty estimation
7. Extend track prediction to 72h horizon
8. Automated hyperparameter tuning (Optuna)

---

*Document version: 1.0*
*Last updated: 2024*
