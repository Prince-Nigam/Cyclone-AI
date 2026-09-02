"use client";

import React, { useState } from "react";
import { AlertCircle, ExternalLink, Globe, Navigation, RefreshCw, ShieldAlert, Wind } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import type { RealtimeCyclone } from "@/types";

interface ActiveCyclonesPanelProps {
  cyclones: RealtimeCyclone[];
  loading: boolean;
  error: string | null;
  indianOceanOnly: boolean;
  onToggleFilter: (ioOnly: boolean) => void;
  onRefresh: () => void;
  onSelectCyclone?: (cyclone: RealtimeCyclone) => void;
  selectedCycloneId?: string | null;
}

export function ActiveCyclonesPanel({
  cyclones,
  loading,
  error,
  indianOceanOnly,
  onToggleFilter,
  onRefresh,
  onSelectCyclone,
  selectedCycloneId,
}: ActiveCyclonesPanelProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filtered = cyclones.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.basin.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getAlertBadgeClass = (alert: string) => {
    switch (alert.toUpperCase()) {
      case "RED":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      case "ORANGE":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "GREEN":
      default:
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Active Cyclones
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                GDACS Live
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time disaster alert feed</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
          title="Refresh active cyclones"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2 mb-3">
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 text-xs">
          <button
            onClick={() => onToggleFilter(false)}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              !indianOceanOnly
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Global ({loading ? "..." : cyclones.length})
          </button>
          <button
            onClick={() => onToggleFilter(true)}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              indianOceanOnly
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Indian Ocean (NI/SI)
          </button>
        </div>

        {cyclones.length > 3 && (
          <input
            type="text"
            placeholder="Search by name or basin..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[450px] custom-scrollbar">
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p className="text-xs">Fetching active cyclone alerts from GDACS...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center space-y-1">
            <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Failed to load live data</p>
            <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Globe className="w-8 h-8 mx-auto text-slate-400/60" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {indianOceanOnly ? "No active cyclones in Indian Ocean" : "No active tropical cyclones reported"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
              GDACS updates every ~5 minutes when new tropical depressions or storms develop.
            </p>
          </div>
        ) : (
          filtered.map((cyclone) => {
            const isSelected = selectedCycloneId === cyclone.id;
            return (
              <div
                key={cyclone.id}
                onClick={() => onSelectCyclone?.(cyclone)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40"
                    : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cyclone.name !== "UNNAMED" ? cyclone.name : cyclone.title.slice(0, 30)}
                    </span>
                    <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Basin: {cyclone.basin}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAlertBadgeClass(cyclone.alert_level)}`}>
                    {cyclone.alert_level}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {cyclone.description || cyclone.title}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <IntensityBadge intensity={cyclone.intensity_class} />
                    {cyclone.wind_kt && (
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                        <Wind className="w-3 h-3 text-cyan-500" />
                        {cyclone.wind_kt} kt ({cyclone.wind_kmh} km/h)
                      </span>
                    )}
                  </div>

                  {cyclone.lat !== null && cyclone.lon !== null && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <Navigation className="w-3 h-3 text-blue-400" />
                      {cyclone.lat.toFixed(1)}°, {cyclone.lon.toFixed(1)}°
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <DataTypeBadge type={cyclone.data_type} />
                  {cyclone.url && (
                    <a
                      href={cyclone.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      GDACS Report <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Updates every ~15m</span>
        <span className="text-emerald-500 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Source
        </span>
      </div>
    </div>
  );
}
