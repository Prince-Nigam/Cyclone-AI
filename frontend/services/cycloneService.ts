/**
 * Cyclone API Service
 * ====================
 * All API calls related to cyclones, predictions, and analysis.
 */

import apiClient from "@/lib/api";
import type {
  AnalysisResult,
  APIResponse,
  Cyclone,
  CycloneListResponse,
  HealthStatus,
  IntensityResult,
  MLModel,
  TrackResult,
} from "@/types";

// ── Health ────────────────────────────────────────────────────────────────────

export const getHealth = async (): Promise<HealthStatus> => {
  const { data } = await apiClient.get<HealthStatus>("/health".replace("/api/v1", ""), {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  });
  return data;
};

// ── Models ────────────────────────────────────────────────────────────────────

export const getModels = async (): Promise<MLModel[]> => {
  const { data } = await apiClient.get<APIResponse<MLModel[]>>("/models");
  return data.data || [];
};

// ── Analysis ──────────────────────────────────────────────────────────────────

export const analyzeImage = async (
  file: File,
  history?: Array<{ lat: number; lon: number; wind_kt: number; pressure_hpa: number }>,
  cycloneId?: string,
  runXai: boolean = true
): Promise<AnalysisResult> => {
  const form = new FormData();
  form.append("file", file);
  if (history) form.append("cyclone_history", JSON.stringify(history));
  if (cycloneId) form.append("cyclone_id", cycloneId);
  form.append("run_xai", String(runXai));

  const { data } = await apiClient.post<APIResponse<AnalysisResult>>("/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return data.data as AnalysisResult;
};

export const detectCyclone = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/detection/predict", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

export const classifyCyclone = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/classification/predict", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};

export const predictIntensity = async (
  history: Array<{ lat: number; lon: number; wind_kt: number; pressure_hpa: number }>
): Promise<IntensityResult> => {
  const { data } = await apiClient.post<APIResponse<IntensityResult>>("/intensity/predict", {
    history,
  });
  return data.data as IntensityResult;
};

export const predictTrack = async (
  history: Array<{ lat: number; lon: number; wind_kt: number; pressure_hpa: number }>,
  horizonHours: number = 24
): Promise<TrackResult> => {
  const { data } = await apiClient.post<APIResponse<TrackResult>>("/track/predict", {
    history,
    prediction_horizon_hours: horizonHours,
  });
  return data.data as TrackResult;
};

// ── Cyclones ──────────────────────────────────────────────────────────────────

export const getCyclones = async (params?: {
  basin?: string;
  year?: number;
  intensity?: string;
  name?: string;
  page?: number;
  limit?: number;
}): Promise<CycloneListResponse> => {
  const { data } = await apiClient.get<APIResponse<CycloneListResponse>>("/cyclones", {
    params,
  });
  return data.data as CycloneListResponse;
};

export const getCyclone = async (cycloneId: string): Promise<Cyclone> => {
  const { data } = await apiClient.get<APIResponse<Cyclone>>(`/cyclones/${cycloneId}`);
  return data.data as Cyclone;
};

// ── Satellite ─────────────────────────────────────────────────────────────────

export const getSatelliteObservations = async (params?: {
  cyclone_id?: string;
  satellite?: string;
  page?: number;
}) => {
  const { data } = await apiClient.get("/satellite", { params });
  return data.data;
};

export const uploadSatelliteImage = async (
  file: File,
  meta?: { satellite?: string; latitude?: number; longitude?: number; channel?: string }
) => {
  const form = new FormData();
  form.append("file", file);
  if (meta?.satellite) form.append("satellite", meta.satellite);
  if (meta?.latitude !== undefined) form.append("latitude", String(meta.latitude));
  if (meta?.longitude !== undefined) form.append("longitude", String(meta.longitude));
  if (meta?.channel) form.append("channel", meta.channel);

  const { data } = await apiClient.post("/satellite/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
};
