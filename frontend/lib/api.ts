/**
 * API Client
 * ===========
 * Centralized axios-based API client for all backend calls.
 */

import axios, { AxiosError, AxiosInstance } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_V1,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const detail = (error.response?.data as any)?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.error || error.message || "Network error";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
export { API_BASE, API_V1 };
