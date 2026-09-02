"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Satellite,
  Layers,
  Wind,
  Eye,
  Activity,
  Waves,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";
import { ActiveCyclonesPanel } from "./components/ActiveCyclonesPanel";
import { OceanWeatherGrid } from "./components/OceanWeatherGrid";
import { LiveTickerBar } from "@/components/ui/LiveTickerBar";
import { getRealtimeCyclones, getOceanGrid } from "@/services/realtimeService";
import type { RealtimeCyclone, OceanWeatherPoint } from "@/types";

const CycloneMap = dynamic(
  () => import("@/components/map/CycloneMap").then((m) => m.CycloneMap),
  { ssr: false, loading: () => <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse min-h-[480px]" /> }
);

const WINDY_OVERLAYS = [
  { key: "satellite",  label: "Satellite",     icon: "🛰️",  desc: "Live satellite imagery" },
  { key: "wind",       label: "Wind",          icon: "💨",  desc: "Real-time wind speed & direction" },
  { key: "rain",       label: "Precipitation", icon: "🌧️", desc: "Rainfall & precipitation" },
  { key: "temp",       label: "Temperature",   icon: "🌡️", desc: "Surface temperature" },
  { key: "pressure",   label: "Pressure",      icon: "📊",  desc: "Sea-level pressure" },
  { key: "clouds",     label: "Clouds",        icon: "☁️",  desc: "Cloud cover" },
];

export default function LiveSatellitePage() {
  const [activeOverlay, setActiveOverlay] = useState("satellite");
  const [windyLoaded, setWindyLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: 15, lon: 75 });
  const [mapZoom, setMapZoom] = useState<number>(4);

  // Real-time Cyclone State
  const [cyclones, setCyclones] = useState<RealtimeCyclone[]>([]);
  const [cyclonesLoading, setCyclonesLoading] = useState<boolean>(true);
  const [cyclonesError, setCyclonesError] = useState<string | null>(null);
  const [indianOceanOnly, setIndianOceanOnly] = useState<boolean>(false);
  const [selectedCycloneId, setSelectedCycloneId] = useState<string | null>(null);

  // Ocean Weather Grid State
  const [oceanPoints, setOceanPoints] = useState<OceanWeatherPoint[]>([]);
  const [gridLoading, setGridLoading] = useState<boolean>(true);
  const [gridError, setGridError] = useState<string | null>(null);

  // Last refreshed timestamp
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Fetch active cyclones
  const loadCyclones = useCallback(async (ioOnly: boolean = indianOceanOnly) => {
    setCyclonesLoading(true);
    setCyclonesError(null);
    try {
      const res = await getRealtimeCyclones(ioOnly);
      setCyclones(res.cyclones || []);
    } catch (err: any) {
      setCyclonesError(err?.message || "Could not connect to cyclone alert feed.");
    } finally {
      setCyclonesLoading(false);
    }
  }, [indianOceanOnly]);

  // Fetch ocean weather grid
  const loadOceanGrid = useCallback(async () => {
    setGridLoading(true);
    setGridError(null);
    try {
      const res = await getOceanGrid();
      setOceanPoints(res.points || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setGridError(err?.message || "Could not fetch marine stations weather.");
    } finally {
      setGridLoading(false);
    }
  }, []);

  // Initial load + periodic 15m refresh
  useEffect(() => {
    loadCyclones(indianOceanOnly);
    loadOceanGrid();

    // Auto-refresh fresh data every 5 minutes
    const interval = setInterval(() => {
      loadCyclones(indianOceanOnly);
      loadOceanGrid();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadCyclones, loadOceanGrid, indianOceanOnly]);

  const handleSelectCyclone = (c: RealtimeCyclone) => {
    setSelectedCycloneId(c.id);
    if (c.lat !== null && c.lon !== null) {
      setMapCenter({ lat: c.lat, lon: c.lon });
      setMapZoom(6);
    }
  };

  const handleSelectWeatherPoint = (pt: OceanWeatherPoint) => {
    setMapCenter({ lat: pt.lat, lon: pt.lon });
    setMapZoom(7);
  };

  // Stats calculation
  const maxWindDetected = oceanPoints.reduce((max, pt) => Math.max(max, pt.wind_kt || 0), 0);

  const windyUrl = `https://embed.windy.com/embed2.html?lat=${mapCenter.lat}&lon=${mapCenter.lon}&detailLat=${mapCenter.lat}&detailLon=${mapCenter.lon}&width=100%&height=100%&zoom=${mapZoom}&level=surface&overlay=${activeOverlay}&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="space-y-6">

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Satellite className="w-7 h-7 text-blue-500" />
              Live Satellite &amp; Real-Time Tracking
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
            Real-time multi-source monitoring combining GDACS disaster alerts, Open-Meteo marine station metrics, NASA GIBS satellite imagery, and Windy.com wind streamlines.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              Live Stream Active
            </span>
          </div>

          {lastRefreshed && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Updated: {lastRefreshed}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Metric Highlights Bar ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Alert Cyclones</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {cyclonesLoading ? "..." : cyclones.length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">GDACS Global Feed</p>
        </div>

        <div className="stat-card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Marine Wind</span>
            <Wind className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {gridLoading ? "..." : `${maxWindDetected.toFixed(1)} kt`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Surface Level 10m</p>
        </div>

        <div className="stat-card bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Monitoring Stations</span>
            <Waves className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {oceanPoints.length} Points
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Arabian Sea &amp; Bay of Bengal</p>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Satellite Tiles</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            MODIS / VIIRS
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">NASA GIBS Real-Time</p>
        </div>
      </div>

      {/* ── Weather Layer Selector ────────────────────────────── */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-blue-500" />
          Weather Overlays
        </div>

        <div className="flex flex-wrap gap-2">
          {WINDY_OVERLAYS.map((o) => (
            <button
              key={o.key}
              onClick={() => { setActiveOverlay(o.key); setWindyLoaded(false); }}
              title={o.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeOverlay === o.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Workspace: Active Cyclones Sidebar + Live Maps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left Column: Active Cyclones Alert Feed (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <ActiveCyclonesPanel
            cyclones={cyclones}
            loading={cyclonesLoading}
            error={cyclonesError}
            indianOceanOnly={indianOceanOnly}
            onToggleFilter={(io) => {
              setIndianOceanOnly(io);
              loadCyclones(io);
            }}
            onRefresh={() => loadCyclones(indianOceanOnly)}
            onSelectCyclone={handleSelectCyclone}
            selectedCycloneId={selectedCycloneId}
          />
        </div>

        {/* Right Column: Maps Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-5">

          {/* Windy Map Component */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌀</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Windy Atmosphere Stream</span>
                <span className="text-[11px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  {WINDY_OVERLAYS.find(o => o.key === activeOverlay)?.label}
                </span>
              </div>
              <a
                href={`https://www.windy.com/?${activeOverlay},${mapCenter.lat},${mapCenter.lon},${mapZoom}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Expand ↗
              </a>
            </div>

            <div className="relative" style={{ height: "480px" }}>
              {!windyLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Connecting to global meteorology satellites...</p>
                  <p className="text-xs text-slate-400 mt-1">ECMWF / GFS Streamlines</p>
                </div>
              )}
              <iframe
                key={`${activeOverlay}-${mapCenter.lat}-${mapCenter.lon}`}
                src={windyUrl}
                className="w-full h-full border-0"
                onLoad={() => setWindyLoaded(true)}
                allow="fullscreen"
                title="Windy Live Weather Map"
              />
            </div>
          </div>

          {/* NASA GIBS Leaflet Map */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛰️</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">NASA GIBS Satellite Layer</span>
                <span className="text-[11px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  MODIS True Color / Thermal
                </span>
              </div>
              <a
                href="https://worldview.earthdata.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                NASA Worldview ↗
              </a>
            </div>

            <div className="p-3">
              <CycloneMap
                height="450px"
                centerLat={mapCenter.lat}
                centerLon={mapCenter.lon}
                zoom={mapZoom}
                showSatelliteToggle={true}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Indian Ocean Real-Time Monitoring Grid ─────────────── */}
      <OceanWeatherGrid
        points={oceanPoints}
        loading={gridLoading}
        error={gridError}
        onRefresh={loadOceanGrid}
        onSelectPoint={handleSelectWeatherPoint}
      />

      {/* ── Data Source Info Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Satellite className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">NASA GIBS Imagery</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Direct Web Map Tile Service (WMTS) feed offering global true-color and infrared reflectance tiles from Terra, Aqua (MODIS), and Suomi NPP (VIIRS).
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">GDACS Disaster Alerts</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            UN/EC Global Disaster Alert and Coordination System provides real-time event identification, severity classifications, and population impact estimations.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Open-Meteo Marine Grid</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            High-resolution numerical weather prediction models delivering 10m wind speeds, sea surface pressure, temperature, and humidity without rate limits.
          </p>
        </div>
      </div>

      {/* ── Research Disclaimer ────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>⚠️ Real-Time Observational Data:</strong> All weather points and alerts shown on this page are <span className="underline font-bold">OBSERVED</span> data streams directly fetched from open scientific APIs (GDACS &amp; Open-Meteo). For official cyclone landfall advisories and warnings, consult the India Meteorological Department (<a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold">IMD</a>).
      </div>

      {/* ── Real-Time 1s Telemetry Stream Bar (Bottom Status Bar) ── */}
      <section className="pt-2">
        <LiveTickerBar />
      </section>

    </div>
  );
}
