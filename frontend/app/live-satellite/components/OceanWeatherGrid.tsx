"use client";

import React, { useState } from "react";
import { Compass, Droplets, Gauge, RefreshCw, Thermometer, Waves, Wind } from "lucide-react";
import type { OceanWeatherPoint } from "@/types";

interface OceanWeatherGridProps {
  points: OceanWeatherPoint[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectPoint?: (pt: OceanWeatherPoint) => void;
}

export function OceanWeatherGrid({
  points,
  loading,
  error,
  onRefresh,
  onSelectPoint,
}: OceanWeatherGridProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");

  const filteredPoints = points.filter((pt) => {
    if (selectedRegion === "ALL") return true;
    return pt.region === selectedRegion;
  });

  const getWindRiskClass = (windKt: number | null) => {
    if (!windKt) return "text-slate-700 dark:text-slate-300";
    if (windKt >= 34) return "text-red-500 font-bold";
    if (windKt >= 22) return "text-amber-500 font-semibold";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const getRegionBadge = (region: string) => {
    switch (region) {
      case "AS":
        return { label: "Arabian Sea", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
      case "BOB":
        return { label: "Bay of Bengal", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" };
      case "IO":
      default:
        return { label: "Indian Ocean", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" };
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
              Indian Ocean Real-Time Monitoring Grid
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                Open-Meteo Live
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live in-situ surface weather metrics across 12 strategic marine stations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Region filter tabs */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 text-xs">
            {["ALL", "AS", "BOB", "IO"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`py-1 px-2.5 rounded-md font-medium transition-all ${
                  selectedRegion === r
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {r === "ALL" ? "All Grid" : r === "AS" ? "Arabian Sea" : r === "BOB" ? "Bay of Bengal" : "South IO"}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
            title="Refresh weather grid"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm font-medium">Fetching real-time atmospheric measurements from Open-Meteo...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Weather data unavailable</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPoints.map((pt) => {
            const regionInfo = getRegionBadge(pt.region);
            return (
              <div
                key={pt.name}
                onClick={() => onSelectPoint?.(pt)}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-all cursor-pointer group hover:border-blue-400/50"
              >
                {/* Point title */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {pt.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {pt.lat.toFixed(1)}°N, {pt.lon.toFixed(1)}°E
                    </span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${regionInfo.color}`}>
                    {regionInfo.label}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  {/* Wind */}
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Wind</p>
                      <p className={`text-xs font-mono ${getWindRiskClass(pt.wind_kt)}`}>
                        {pt.wind_kt !== null ? `${pt.wind_kt} kt` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Pressure</p>
                      <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {pt.pressure_hpa !== null ? `${Math.round(pt.pressure_hpa)} hPa` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Temp</p>
                      <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {pt.temp_c !== null ? `${pt.temp_c}°C` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Humidity / Direction */}
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Humidity</p>
                      <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {pt.humidity_pct !== null ? `${pt.humidity_pct}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {pt.wind_dir_deg !== null && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Compass className="w-2.5 h-2.5" /> Dir: {pt.wind_dir_deg}°
                    </span>
                    <span className="text-[9px] bg-slate-200/50 dark:bg-slate-800/60 px-1 py-0.2 rounded">
                      OBSERVED
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
