# 🛰️ Multi-Source Satellite Data Fusion

> Tropical Cyclone AI Platform — Fusion Architecture Documentation

---

## 1. Why Multi-Source Fusion?

Different satellites observe different physical properties of tropical cyclones:

| Satellite | Channel | What it shows |
|-----------|---------|---------------|
| HURSAT-B1 (IR) | 10.8 μm | Cloud top temperature → convection depth |
| INSAT-3D (WV) | 6.8 μm | Water vapor distribution → moisture |
| INSAT-3D (VIS) | 0.65 μm | Cloud reflectance → structure |
| INSAT-3D (TIR) | 12.0 μm | Surface + cloud temperature |

**No single satellite captures the full picture.**

Combining information:
- Improves detection accuracy
- Provides complementary features for classification
- Reduces dependence on single-point-of-failure
- Mimics how operational meteorologists use multiple satellite products

---

## 2. Spatial and Temporal Alignment

### 2.1 Problem
Different satellites have different:
- Spatial resolutions (HURSAT: ~8km, INSAT-3D: 1–4km)
- Temporal cadences (HURSAT: 3h, INSAT-3D: 30min)
- Geographic projections
- Image dimensions

### 2.2 Alignment Strategy

```
HURSAT Image (201×201, 8km, IR, 3h)
            │
            ▼
  Extract bounding box (lat/lon range)
            │
            ▼
INSAT Image (variable, 4km, TIR1, 30min)
            │
            ▼
  Find closest INSAT observation to HURSAT timestamp
  (max ±90 min tolerance)
            │
            ▼
  Reproject INSAT to HURSAT bounding box
  (bilinear interpolation)
            │
            ▼
  Resize both to 224×224
            │
            ▼
  Align channels: [HURSAT_IR | INSAT_TIR | INSAT_WV]
```

### 2.3 Temporal Matching
```python
def find_closest_observation(hursat_time, insat_times, max_gap_minutes=90):
    """Find closest INSAT observation within tolerance."""
    deltas = abs(insat_times - hursat_time)
    min_delta = deltas.min()
    if min_delta > pd.Timedelta(minutes=max_gap_minutes):
        return None  # No valid match
    return insat_times[deltas.argmin()]
```

---

## 3. Fusion Architectures

### 3.1 Early Fusion (Input-Level)

```
HURSAT_IR   INSAT_TIR   INSAT_WV
    │            │           │
    └────────────┴───────────┘
                 │
         Stack as channels
         [B, 3, 224, 224]
                 │
         Single CNN backbone
                 │
         Unified features → Prediction
```

**Pros**: Simple, single forward pass  
**Cons**: Requires all sources simultaneously; spatial alignment critical

---

### 3.2 Feature-Level Fusion (Chosen Approach)

```
HURSAT_IR        INSAT_TIR       INSAT_WV
    │                │               │
EfficientNet     EfficientNet    EfficientNet
  Encoder          Encoder        Encoder
    │                │               │
feat_hursat(512) feat_insat_tir(512) feat_wv(512)
    │                │               │
    └────────────────┴───────────────┘
                     │
              Concatenate [1536]
                     │
              Fusion MLP:
               Linear(1536→512)
               BatchNorm + ReLU + Dropout
               Linear(512→256)
               ReLU
                     │
              Task Head:
               Detection: Linear(256→1) + Sigmoid
               Classification: Linear(256→5) + Softmax
```

**Pros**: Each source independently encoded; missing source handled gracefully  
**Cons**: 3× parameters in encoder stage

---

### 3.3 Late Fusion (Decision-Level)

```
HURSAT → Model_A → prediction_A (probability vector)
INSAT  → Model_B → prediction_B (probability vector)
                │
         Weighted Average
         (weights from validation performance)
                │
         Final Prediction
```

**Pros**: Independent models; easiest to add new source  
**Cons**: Cannot learn cross-source interactions

---

## 4. Chosen Architecture: Feature-Level Fusion

Feature-level fusion is the primary approach because:
1. Shared encoder architecture allows knowledge transfer
2. Fusion MLP learns cross-source relationships
3. Can handle missing sources (zero vector substitution)
4. More powerful than late fusion

---

## 5. Handling Missing Sources

When one satellite source is unavailable:

```python
class FusionModel(nn.Module):
    def forward(self, hursat_img=None, insat_img=None):
        features = []

        if hursat_img is not None:
            feat_a = self.encoder_hursat(hursat_img)
        else:
            feat_a = torch.zeros(B, 512).to(device)  # zero vector
            self.missing_source_flag = True

        if insat_img is not None:
            feat_b = self.encoder_insat(insat_img)
        else:
            feat_b = torch.zeros(B, 512).to(device)
            self.missing_source_flag = True

        fused = torch.cat([feat_a, feat_b], dim=1)
        return self.fusion_mlp(fused)
```

**Response when source missing**:
```json
{
  "fusion_mode": "single_source",
  "available_sources": ["HURSAT"],
  "missing_sources": ["INSAT-3D"],
  "warning": "Running in single-source mode. Multi-source fusion unavailable.",
  "confidence_modifier": -0.05
}
```

---

## 6. Adding New Satellite Sources

The architecture is designed to be extensible:

```python
# To add Himawari-8 as a third source:

class ExtendedFusionModel(FusionModel):
    def __init__(self):
        super().__init__()
        # Add new encoder
        self.encoder_himawari = EfficientNetEncoder(in_channels=1)
        # Update fusion MLP input size: 512 × 3 = 1536
        self.fusion_mlp = FusionMLP(input_dim=1536, ...)
```

New source integration checklist:
- [ ] Data loader for new format
- [ ] Preprocessing pipeline
- [ ] Temporal alignment
- [ ] Spatial alignment to common grid
- [ ] Add encoder branch
- [ ] Update fusion MLP input dimensions
- [ ] Retrain or fine-tune
- [ ] Update documentation

---

## 7. Differences Between Sources

| Property | HURSAT-B1 | INSAT-3D | Himawari-8 |
|----------|-----------|----------|------------|
| Spatial res | ~8 km | 4 km | 2 km |
| Temporal res | 3h | 30 min | 10 min |
| Spectral | IR only | 6 channels | 16 channels |
| Coverage | Global | Indian Ocean | Asia-Pacific |
| Data age | 1978–2015 | 2013–now | 2015–now |
| Format | NetCDF | HDF5 | HSD/NetCDF |
| Access | Free | Free+registration | Free+registration |

---

## 8. Current Implementation Status

| Source | Status | Notes |
|--------|--------|-------|
| HURSAT-B1 | ✅ Implemented | Primary training source |
| INSAT-3D | 🔄 Architecture ready | Requires MOSDAC credentials |
| Himawari-8 | 📋 Documented | Future implementation |
| NOAA GOES | 📋 Documented | Atlantic focus |

**Phase 1**: Single source (HURSAT) — working baseline  
**Phase 2**: Dual source (HURSAT + INSAT) — fusion enabled  
**Phase 3**: Triple source (+ Himawari) — full multi-source

---

*Document version: 1.0*
*Last updated: 2024*
