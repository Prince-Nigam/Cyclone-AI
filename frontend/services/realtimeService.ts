/**
 * Real-Time Data Service
 * =======================
 * API client calls for live cyclone tracking and ocean weather.
 */

import apiClient from "@/lib/api";
import type {
  APIResponse,
  OceanGridResponse,
  OceanWeatherPoint,
  RealtimeCycloneListResponse,
} from "@/types";

export const getRealtimeCyclones = async (
  indianOceanOnly: boolean = false
): Promise<RealtimeCycloneListResponse> => {
  const { data } = await apiClient.get<APIResponse<RealtimeCycloneListResponse>>(
    "/realtime/cyclones",
    {
      params: { indian_ocean_only: indianOceanOnly },
    }
  );
  return data.data as RealtimeCycloneListResponse;
};

export const getRealtimeWeather = async (
  lat: number,
  lon: number
): Promise<OceanWeatherPoint> => {
  const { data } = await apiClient.get<APIResponse<OceanWeatherPoint>>(
    "/realtime/weather",
    {
      params: { lat, lon },
    }
  );
  return data.data as OceanWeatherPoint;
};

export const getOceanGrid = async (): Promise<OceanGridResponse> => {
  const { data } = await apiClient.get<APIResponse<OceanGridResponse>>(
    "/realtime/ocean-grid"
  );
  return data.data as OceanGridResponse;
};
