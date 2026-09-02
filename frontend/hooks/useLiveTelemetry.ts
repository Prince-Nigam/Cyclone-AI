"use client";

import { useEffect, useState, useRef } from "react";
import apiClient from "@/lib/api";
import type { APIResponse } from "@/types";

export interface LiveTelemetryData {
  timestamp_epoch: number;
  utc_time: string;
  time_hms: string;
  status: string;
  pulse_id: number;
  active_cyclones_count: number;
  active_cyclones: any[];
  ocean_grid: Array<{
    name: string;
    region: string;
    lat: number;
    lon: number;
    wind_kt: number | null;
    wind_kt_instant: number;
    pressure_hpa: number | null;
    pressure_hpa_instant: number;
    temp_c: number | null;
    humidity_pct: number | null;
    wind_dir_deg: number | null;
    telemetry_time: string;
  }>;
  cache_age_seconds: number;
}

export function useLiveTelemetry(pollIntervalSec: number = 3) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [pulse, setPulse] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<LiveTelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [syncCountdown, setSyncCountdown] = useState<number>(pollIntervalSec);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);

  const countdownRef = useRef<number>(pollIntervalSec);

  // 1. Second-by-Second clock ticker (1000ms)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hms = now.toLocaleTimeString("en-GB", { hour12: false });
      const fullUtc = now.toUTCString().split(" ").slice(4, 5)[0] + " UTC";
      setCurrentTime(`${hms} (${fullUtc})`);
      setCurrentSeconds(now.getSeconds());
      setPulse((prev) => !prev);

      // Decrement sync countdown
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        countdownRef.current = pollIntervalSec;
      }
      setSyncCountdown(countdownRef.current);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pollIntervalSec]);

  // 2. Periodic Live Feed Fetcher
  const fetchLiveFeed = async () => {
    try {
      const { data } = await apiClient.get<APIResponse<LiveTelemetryData>>(
        "/realtime/live-feed"
      );
      if (data?.data) {
        setTelemetry(data.data);
        setIsConnected(true);
        const syncStr = new Date().toLocaleTimeString("en-GB", { hour12: false });
        setLastSyncTime(syncStr);

        // Add to live rolling logs
        const logMsg = `[${syncStr}] Telemetry frame #${data.data.pulse_id % 10000} — ${data.data.active_cyclones_count} active storms, 12 marine stations stream active`;
        setLiveLogs((prev) => [logMsg, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, pollIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [pollIntervalSec]);

  return {
    currentTime,
    currentSeconds,
    pulse,
    telemetry,
    isConnected,
    lastSyncTime,
    syncCountdown,
    liveLogs,
    refreshNow: fetchLiveFeed,
  };
}
