"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Satellite, Layers, Wind, Thermometer, CloudRain, Eye } from "lucide-react";

// CycloneMap loaded dynamically (Leaflet SSR fix)
const CycloneMap = dynamic(
  () => import("@/components/map/CycloneMap").then((m) => m.CycloneMap),
  { ssr: false, loading: () => <div className="h-full bg-slate-100 rounded-xl animate-pulse" /> }
);

// ── Windy overlay options ─────────────────────────────────────────────────────
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

  const windyUrl = `https://embed.windy.com/embed2.html?lat=15&lon=75&detailLat=15&detailLon=75&width=100%&height=100%&zoom=5&level=surface&overlay=${activeOverlay}&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Satellite className="w-6 h-6 text-blue-600" />
            Live Satellite View
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time satellite imagery &amp; weather overlays powered by{" "}
            <a href="https://windy.com" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium">Windy.com</a>{" "}
            and{" "}
            <a href="https://nasa.gov/gibs" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium">NASA GIBS</a>.
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 text-sm font-medium">Live Data</span>
        </div>
      </div>

      {/* Overlay selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> SELECT WEATHER LAYER
        </p>
        <div className="flex flex-wrap gap-2">
          {WINDY_OVERLAYS.map((o) => (
            <button
              key={o.key}
              onClick={() => { setActiveOverlay(o.key); setWindyLoaded(false); }}
              title={o.desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                activeOverlay === o.key
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content: Windy embed + NASA GIBS map */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── Windy Live Map ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌀</span>
              <span className="font-semibold text-slate-800 text-sm">Windy Live Weather</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {WINDY_OVERLAYS.find(o => o.key === activeOverlay)?.label}
              </span>
            </div>
            <a
              href={`https://www.windy.com/?${activeOverlay},15,75,5`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Open full screen ↗
            </a>
          </div>

          <div className="relative" style={{ height: "500px" }}>
            {!windyLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading live satellite data…</p>
                <p className="text-xs text-slate-400 mt-1">Powered by Windy.com</p>
              </div>
            )}
            <iframe
              key={activeOverlay}
              src={windyUrl}
              className="w-full h-full border-0"
              onLoad={() => setWindyLoaded(true)}
              allow="fullscreen"
              title="Windy Live Weather Map"
            />
          </div>
        </div>

        {/* ── NASA GIBS Map ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛰️</span>
              <span className="font-semibold text-slate-800 text-sm">NASA GIBS Satellite</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                MODIS / VIIRS
              </span>
            </div>
            <a
              href="https://worldview.earthdata.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              NASA Worldview ↗
            </a>
          </div>

          <CycloneMap
            height="500px"
            centerLat={15}
            centerLon={75}
            zoom={4}
            showSatelliteToggle={true}
          />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Satellite className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800 text-sm">NASA GIBS</span>
          </div>
          <p className="text-xs text-blue-700">
            Global Imagery Browse Services — free MODIS &amp; VIIRS satellite tiles.
            Updated daily. No API key needed.
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800 text-sm">Windy.com</span>
          </div>
          <p className="text-xs text-green-700">
            Real-time ECMWF weather model data. Shows live wind, rain,
            temperature, and satellite imagery with animation.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-800 text-sm">Coverage</span>
          </div>
          <p className="text-xs text-orange-700">
            Indian Ocean basin coverage including Arabian Sea &amp; Bay of Bengal.
            Optimal for monitoring NI basin cyclones.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800">
        <strong>⚠️ Data Sources:</strong> Satellite imagery is provided by NASA GIBS and Windy.com.
        These are observational data sources, not model predictions. AI analysis requires uploading
        an image on the <a href="/satellite" className="underline font-medium">Satellite Analysis</a> page.
      </div>
    </div>
  );
}
