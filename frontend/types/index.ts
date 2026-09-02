/**
 * TypeScript type definitions for the Cyclone AI Platform frontend.
 */

// ── Data Type Labels ──────────────────────────────────────────────────────────

export type DataType = "OBSERVED" | "HISTORICAL" | "SIMULATED" | "PREDICTED";

// ── Cyclone ───────────────────────────────────────────────────────────────────

export type IntensityClass = "TD" | "TS" | "CAT1" | "CAT2" | "CAT3_PLUS" | "UNKNOWN";

export const INTENSITY_LABELS: Record<IntensityClass, string> = {
  TD:        "Tropical Depression",
  TS:        "Tropical Storm",
  CAT1:      "Category 1",
  CAT2:      "Category 2",
  CAT3_PLUS: "Category 3/4/5",
  UNKNOWN:   "Unknown",
};

export const INTENSITY_WIND_RANGES: Record<IntensityClass, string> = {
  TD:        "< 34 kt",
  TS:        "34–63 kt",
  CAT1:      "64–82 kt",
  CAT2:      "83–95 kt",
  CAT3_PLUS: "≥ 96 kt",
  UNKNOWN:   "Unknown",
};

export const INTENSITY_COLORS: Record<IntensityClass, string> = {
  TD:        "#22c55e",
  TS:        "#eab308",
  CAT1:      "#f97316",
  CAT2:      "#ef4444",
  CAT3_PLUS: "#9333ea",
  UNKNOWN:   "#6b7280",
};

export interface TrackPoint {
  id?: string;
  timestamp?: string;
  latitude: number;
  longitude: number;
  wind_kt?: number;
  pressure_hpa?: number;
  intensity_class?: IntensityClass;
  data_type?: DataType;
  source?: string;
}

export interface PredictedTrackPoint {
  step: number;
  hours_ahead: number;
  lat: number;
  lon: number;
}

export interface Cyclone {
  id: string;
  name?: string;
  basin?: string;
  season?: number;
  start_time?: string;
  end_time?: string;
  peak_wind_kt?: number;
  min_pressure_hpa?: number;
  peak_intensity?: IntensityClass;
  num_observations?: number;
  source?: string;
  data_type?: DataType;
  track?: TrackPoint[];
  observations?: SatelliteObservation[];
}

export interface CycloneListResponse {
  cyclones: Cyclone[];
  total: number;
  page: number;
  pages: number;
}

// ── Satellite ─────────────────────────────────────────────────────────────────

export interface SatelliteObservation {
  id: string;
  cyclone_id?: string;
  satellite?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  image_path?: string;
  channel?: string;
  resolution_km?: number;
  data_type?: DataType;
  is_uploaded?: boolean;
}

// ── Predictions ───────────────────────────────────────────────────────────────

export interface DetectionResult {
  detected?: boolean;
  confidence?: number;
  model_version?: string;
  data_type?: DataType;
  disclaimer?: string;
  error?: string;
}

export interface ClassificationResult {
  pattern?: IntensityClass;
  pattern_label?: string;
  wind_range_kt?: string;
  confidence?: number;
  probabilities?: Record<IntensityClass, number>;
  model_version?: string;
  data_type?: DataType;
  disclaimer?: string;
  error?: string;
}

export interface IntensityResult {
  predicted_wind_kt?: number;
  predicted_pressure_hpa?: number;
  intensity_class?: IntensityClass;
  model_version?: string;
  data_type?: DataType;
  available?: boolean;
  reason?: string;
  disclaimer?: string;
  error?: string;
}

export interface TrackResult {
  predicted_track?: PredictedTrackPoint[];
  prediction_horizon_hours?: number;
  model_version?: string;
  data_type?: DataType;
  available?: boolean;
  reason?: string;
  uncertainty_note?: string;
  disclaimer?: string;
  error?: string;
}

export interface ExplainabilityResult {
  heatmap_base64?: string;
  method?: string;
  method_description?: string;
  disclaimer?: string;
  available?: boolean;
  reason?: string;
}

export interface AnalysisResult {
  success: boolean;
  detection?: DetectionResult;
  classification?: ClassificationResult;
  intensity?: IntensityResult;
  track?: TrackResult;
  explainability?: ExplainabilityResult;
  metadata?: {
    data_type?: DataType;
    inference_time_ms?: number;
    model_versions?: Record<string, string>;
    prediction_id?: string;
  };
  error?: string;
}

// ── Models ────────────────────────────────────────────────────────────────────

export interface MLModel {
  id: string;
  name: string;
  version: string;
  architecture?: string;
  task: string;
  status: "loaded" | "not_loaded" | "error";
  notes?: string;
  accuracy?: number;
  f1_score?: number;
  mae?: number;
  rmse?: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  models: Record<string, string>;
  database: string;
  timestamp: string;
}

// ── UI State ──────────────────────────────────────────────────────────────────

export interface AnalysisState {
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  selectedFile: File | null;
  selectedCycloneId: string | null;
}

export type AlertLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export const ALERT_COLORS: Record<AlertLevel, string> = {
  LOW:      "#22c55e",
  MODERATE: "#eab308",
  HIGH:     "#f97316",
  CRITICAL: "#ef4444",
};

// ── Real-Time Data ────────────────────────────────────────────────────────────

export interface RealtimeCyclone {
  id: string;
  name: string;
  lat: number | null;
  lon: number | null;
  wind_kt: number | null;
  wind_kmh: number | null;
  intensity_class: IntensityClass;
  alert_level: "GREEN" | "ORANGE" | "RED" | string;
  basin: string;
  title: string;
  description: string;
  url: string;
  published: string;
  source: string;
  data_type: DataType;
  fetched_at: string;
}

export interface RealtimeCycloneListResponse {
  cyclones: RealtimeCyclone[];
  total: number;
  source: string;
  data_type: DataType;
  indian_ocean: boolean;
  disclaimer: string;
}

export interface OceanWeatherPoint {
  name: string;
  region: "AS" | "BOB" | "IO" | string;
  lat: number;
  lon: number;
  wind_kt: number | null;
  wind_dir_deg: number | null;
  pressure_hpa: number | null;
  temp_c: number | null;
  humidity_pct: number | null;
  timestamp: string | null;
  source: string;
  data_type: DataType;
}

export interface OceanGridResponse {
  points: OceanWeatherPoint[];
  total: number;
  source: string;
  data_type: DataType;
}

