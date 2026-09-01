# 🛰️ Satellite Data Sources Documentation

> This document describes all data sources used in the Tropical Cyclone AI Platform.
> All data must be clearly labeled: OBSERVED / HISTORICAL / SIMULATED / PREDICTED.

---

## 1. IBTrACS — International Best Track Archive for Climate Stewardship

| Field | Details |
|-------|---------|
| **Source** | NOAA National Centers for Environmental Information (NCEI) |
| **Data Type** | Tabular best-track records (CSV / NetCDF) |
| **Spatial Resolution** | Point observations (lat/lon) |
| **Temporal Resolution** | 3-hourly / 6-hourly observations |
| **Geographic Coverage** | Global — all ocean basins |
| **Time Period** | 1842 — present |
| **Format** | CSV, NetCDF |
| **Access Method** | Direct download (no account required) |
| **URL** | https://www.ncei.noaa.gov/products/international-best-track-archive |
| **License** | Public Domain (NOAA) |

### Data Fields Used
- `SID` — Storm ID
- `NAME` — Storm name
- `ISO_TIME` — Timestamp (UTC)
- `LAT`, `LON` — Position
- `WMO_WIND` / `USA_WIND` — Max sustained wind speed (kt)
- `WMO_PRES` / `USA_PRES` — Central pressure (hPa)
- `USA_SSHS` — Saffir-Simpson Category (-5=TD, -4=TS, 1–5=CAT)
- `BASIN` — Ocean basin code

### Advantages
- Most complete global tropical cyclone record
- Scientifically validated by WMO agencies
- Consistent long-term historical coverage
- Free to download

### Limitations
- Best-track data is post-analysis (not real-time)
- Wind/pressure estimates vary by reporting agency
- Early records (pre-satellite era) less reliable
- 6-hourly gaps between observations

### Use in Project
- Primary source for cyclone track labels
- Intensity labels for classification model
- Training targets for intensity/track prediction models
- Ground truth for evaluation

---

## 2. HURSAT-B1 — Hurricane Satellite Data

| Field | Details |
|-------|---------|
| **Source** | NOAA NCEI |
| **Data Type** | Infrared satellite images centered on tropical cyclones |
| **Spatial Resolution** | ~8 km per pixel |
| **Image Size** | 201 × 201 pixels per image |
| **Temporal Resolution** | 3-hourly |
| **Geographic Coverage** | Global tropical cyclones |
| **Time Period** | 1978 — 2015 |
| **Format** | NetCDF (.nc) |
| **Access Method** | HTTPS direct download (no account required) |
| **URL** | https://www.ncei.noaa.gov/products/hurricane-satellite-data |
| **License** | Public Domain (NOAA) |

### Data Fields
- `IRWIN` — Infrared window brightness temperature (K)
- `LAT`, `LON` — Image center coordinates
- `TIME` — Observation timestamp
- `STORMID` — Linked to IBTrACS storm ID

### Advantages
- Images already centered on cyclones
- Directly linked to IBTrACS records
- Consistent preprocessing across all storms
- Good temporal coverage (37 years)

### Limitations
- Limited to 1978–2015 (archive closed)
- Single channel (IR only)
- ~8 km spatial resolution
- Not real-time

### Use in Project
- Primary image dataset for detection model training
- Primary image dataset for classification model training
- Feature extraction for intensity/track models
- Grad-CAM visualization source

---

## 3. INSAT-3D / INSAT-3DR — Indian National Satellite System

| Field | Details |
|-------|---------|
| **Source** | MOSDAC — Meteorological and Oceanographic Satellite Data Archival Centre (SAC/ISRO) |
| **Data Type** | Multi-channel geostationary imagery |
| **Channels** | VIS (0.65μm), SWIR (1.6μm), MIR (3.9μm), WV (6.8μm), TIR-1 (10.8μm), TIR-2 (12.0μm) |
| **Spatial Resolution** | 1 km (VIS), 4 km (IR channels) |
| **Temporal Resolution** | 30 minutes (full disk), 15 minutes (India sector) |
| **Geographic Coverage** | Indian Ocean, South Asia, Bay of Bengal, Arabian Sea |
| **Time Period** | 2013 — present |
| **Format** | HDF5 |
| **Access Method** | Registration required at mosdac.gov.in |
| **URL** | https://mosdac.gov.in |
| **License** | ISRO data policy (research use permitted with attribution) |

### Advantages
- High temporal resolution (30 min)
- Multiple spectral channels
- Focused on Indian Ocean — relevant for Bay of Bengal cyclones
- Ongoing archive (present day data available)

### Limitations
- Requires MOSDAC registration
- Large HDF5 files
- Complex format requiring specialized reading libraries
- Limited to Indian Ocean domain

### Use in Project
- Secondary satellite source for multi-source fusion
- Indian Ocean cyclone analysis
- Additional channel information (WV, TIR) for feature extraction

---

## 4. Himawari-8/9 — Japan Meteorological Agency

| Field | Details |
|-------|---------|
| **Source** | Japan Meteorological Agency (JMA) |
| **Data Type** | Multi-band geostationary imagery |
| **Channels** | 16 bands (VIS to IR) |
| **Spatial Resolution** | 0.5–2 km depending on band |
| **Temporal Resolution** | 10 minutes (full disk) |
| **Geographic Coverage** | Asia-Pacific, Indian Ocean |
| **Time Period** | 2015 — present |
| **Format** | HSD (Himawari Standard Data) / NetCDF |
| **Access Method** | JAXA P-Tree system (registration required) |
| **URL** | https://www.eorc.jaxa.jp/ptree/ |
| **License** | JMA data policy |

### Advantages
- Very high temporal resolution (10 min)
- 16 spectral bands
- Excellent Asia-Pacific coverage
- Good for Bay of Bengal and Arabian Sea cyclones

### Limitations
- Large data volumes
- Registration required
- Complex HSD format

### Use in Project
- Optional third source for multi-source fusion
- High-temporal-resolution analysis
- Western Pacific cyclone coverage

---

## 5. NOAA GOES-16/18 — Geostationary Operational Environmental Satellites

| Field | Details |
|-------|---------|
| **Source** | NOAA / NASA |
| **Data Type** | Multi-band geostationary imagery |
| **Channels** | 16 bands (ABI instrument) |
| **Spatial Resolution** | 0.5–2 km depending on band |
| **Temporal Resolution** | 5–15 minutes |
| **Geographic Coverage** | Americas, Atlantic, East Pacific |
| **Time Period** | 2017 — present |
| **Format** | NetCDF |
| **Access Method** | NOAA Big Data Program (AWS S3, free) |
| **URL** | https://registry.opendata.aws/noaa-goes/ |
| **License** | NOAA Open Data (public domain) |

### Advantages
- Freely available on AWS S3
- No registration required
- Very high temporal resolution
- Multiple spectral bands

### Limitations
- Atlantic/East Pacific focus (less relevant for Indian cyclones)
- Large file sizes

### Use in Project
- Optional: Atlantic hurricane analysis
- Demonstration of multi-source capability
- Feature comparison between ocean basins

---

## Data Source Summary Table

| Source | Primary Use | Available | Registration | Cost |
|--------|------------|-----------|--------------|------|
| IBTrACS | Track labels, intensity labels | ✅ Yes | No | Free |
| HURSAT-B1 | Training images | ✅ Yes | No | Free |
| INSAT-3D | Indian Ocean fusion | ✅ Yes | Yes (MOSDAC) | Free |
| Himawari-8 | Asia-Pacific fusion | ✅ Yes | Yes (JAXA) | Free |
| NOAA GOES | Atlantic analysis | ✅ Yes | No | Free |

---

## Data Usage in Project Phases

| Phase | Data Source | Purpose |
|-------|------------|---------|
| Detection Training | HURSAT-B1 + IBTrACS | Image + binary label |
| Classification Training | HURSAT-B1 + IBTrACS | Image + intensity class |
| Intensity Training | IBTrACS | Wind speed / pressure regression |
| Track Training | IBTrACS | Lat/lon sequence |
| Multi-source Fusion | HURSAT-B1 + INSAT-3D | Feature concatenation |
| Historical Analysis | IBTrACS | Browse past cyclones |
| Demo/Visualization | HURSAT-B1 samples | Image viewer |

---

## Download Instructions

### IBTrACS

```bash
# Download North Indian Ocean basin
wget https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r00/access/csv/ibtracs.NI.list.v04r00.csv

# Download all basins
wget https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r00/access/csv/ibtracs.ALL.list.v04r00.csv
```

### HURSAT-B1

```bash
# Download index file
wget https://www.ncei.noaa.gov/data/hurricane-satellite-hursat-b1/archive/v06/

# Individual storm downloads available by storm ID
# See ai/datasets/download_hursat.py for automated download
```

---

*Last updated: 2024*
*Document version: 1.0*
