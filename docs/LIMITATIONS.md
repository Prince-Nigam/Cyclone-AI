# ⚠️ System Limitations and Constraints

> Tropical Cyclone AI Platform — Honest documentation of known limitations.
> Scientific integrity requires documenting what the system cannot do.

---

## Critical Disclaimers

1. **This is NOT an operational weather forecasting system.**
2. **This is NOT an official government warning system.**
3. **Predictions should NOT be used for emergency decision-making.**
4. **All model outputs are research-grade estimates.**
5. **Accuracy numbers are from prototype evaluation, not operational validation.**

---

## 1. Data Limitations

### 1.1 Training Data Temporal Range
- HURSAT-B1 archive covers **1978–2015 only**
- Recent changes in cyclone patterns (post-2015) not represented in training
- Climate change may alter cyclone characteristics beyond training distribution

### 1.2 Spatial Coverage
- HURSAT-B1 is global but biased toward Atlantic/Pacific storms
- Indian Ocean (Bay of Bengal, Arabian Sea) has fewer historical samples
- High-latitude cyclone behavior may be underrepresented

### 1.3 Single Spectral Channel
- HURSAT-B1 provides IR channel only
- No visible (VIS), water vapor (WV), or shortwave IR channels in baseline
- Multi-channel analysis (INSAT-3D) requires separate data acquisition

### 1.4 Spatial Resolution
- HURSAT-B1 resolution: ~8 km per pixel
- Fine-scale cyclone features (eye wall, rainbands) may not be well resolved
- Modern operational satellites (INSAT-3D: 1–4 km) are higher resolution

### 1.5 No Real-Time Data
- This prototype does not have real-time satellite data ingestion
- All analysis is performed on historical or uploaded data
- System does **not** show "live" cyclone status

---

## 2. Model Limitations

### 2.1 Detection Model
- Binary classifier may miss developing/weak systems (TD stage)
- Confidence scores are from model output — not calibrated against operational datasets
- Performance on Indian Ocean storms may be lower (training bias toward Atlantic)

### 2.2 Classification Model
- 5 classes based on Saffir-Simpson scale
- CAT3/4/5 merged due to class imbalance (limited high-intensity samples)
- Classification based on IR appearance only — may misclassify storms with unusual structure
- Does not distinguish extra-tropical cyclones

### 2.3 Intensity Prediction
- Not validated against dropsonde or flight reconnaissance data
- Accuracy limited by IR-only input (brightness temperature is indirect intensity proxy)
- Rapid intensification events are difficult to predict from satellite alone
- Landfall intensity prediction not specifically trained

### 2.4 Track Prediction
- 24-hour horizon is short; operational systems forecast up to 5 days
- No NWP (Numerical Weather Prediction) steering flow data used
- Performance degrades significantly beyond 24h
- Track prediction trained only on IBTrACS historical data

### 2.5 Multi-Source Fusion
- Full dual-source fusion requires INSAT-3D access (MOSDAC registration)
- In prototype demo, single-source mode is primarily used
- Zero-vector substitution for missing source introduces information gap

---

## 3. Technical Limitations

### 3.1 Computational Resources
- Deep learning inference runs on CPU for demo (no GPU assumed)
- Single image inference may take 2–10 seconds on CPU
- Batch processing not optimized for production scale

### 3.2 Model Training
- Models trained on limited hardware; not exhaustively hyperparameter tuned
- Training on full HURSAT dataset (60,000+ images) requires significant compute
- Sample/demo models use subset of data

### 3.3 No Uncertainty Quantification
- Point estimates returned without confidence intervals
- No Monte Carlo Dropout or ensemble uncertainty
- Users cannot know how uncertain the predictions are

### 3.4 No Ensemble
- Single model per task; ensemble would improve accuracy
- No model stacking or blending implemented

---

## 4. System Limitations

### 4.1 No Automated Alerts
- System does not generate automated warnings
- Alert module is prototype-level visualization only
- Not connected to any official alert infrastructure

### 4.2 No Physics Constraints
- Pure data-driven ML; no physical equations enforced
- Predicted tracks may occasionally violate meteorological physics
- No thermodynamic consistency checking

### 4.3 Geographic Focus
- System optimized for tropical cyclones in oceanic regions
- Does not handle subtropical storms, mid-latitude cyclones, nor polar lows
- Bay of Bengal / Arabian Sea coverage depends on INSAT data availability

### 4.4 Historical Data Only (for training)
- Training data ends 2015 (HURSAT archive)
- Test cyclones post-2015 are unseen during training
- Concept drift possible for recent cyclone behavior

---

## 5. Operational Limitations

### 5.1 Not Operationally Validated
- Not compared against IMD (India Meteorological Department) operational forecasts
- Not validated against JTWC or NHC official track/intensity data
- Performance in operational setting unknown

### 5.2 Not Peer-Reviewed
- Models and methodology not subject to scientific peer review
- Results should be interpreted as student/prototype-level research

### 5.3 No Quality Assurance Process
- No operational QA/QC process in place
- Missing data handling is basic (mean substitution)
- Edge cases may produce unreliable outputs

---

## 6. Known Issues

| Issue | Impact | Status |
|-------|--------|--------|
| Class imbalance (CAT3+) | Lower recall for intense storms | Documented, partially mitigated by class weights |
| Training data ends 2015 | May miss recent climate trends | Documented limitation |
| Single IR channel | Misses moisture structure | Multi-channel fusion in progress |
| 24h track limit | Limited operational utility | Future work: 72h extension |
| CPU-only inference | Slow for demo | GPU support implemented but not guaranteed |

---

## 7. Future Work to Address Limitations

| Limitation | Proposed Fix |
|-----------|-------------|
| Data through 2015 only | Integrate INSAT-3D (2013–present) or GOES-16 (2017–present) |
| Single channel | Multi-channel input (IR + WV + VIS) |
| 24h track only | Extend Seq2Seq to 72h with NWP steering |
| No uncertainty | Monte Carlo Dropout uncertainty estimation |
| No physics | Physics-informed loss functions |
| Class imbalance | Focal loss + targeted oversampling |
| No calibration | Temperature scaling post-training |

---

*These limitations do not diminish the value of the system as a research prototype and learning platform.*
*Honest documentation of limitations is itself a mark of scientific integrity.*

---

*Document version: 1.0*
*Last updated: 2024*
