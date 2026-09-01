"use client";

/**
 * CycloneMap
 * ===========
 * Interactive Leaflet map showing:
 * - Historical cyclone track (blue line)
 * - Predicted cyclone track (orange dashed line)
 * - NASA GIBS live satellite imagery layer (toggle)
 * - Track point markers with metadata popups
 */

import React, { useEffect, useRef, useState } from "react";
import type { TrackPoint, PredictedTrackPoint } from "@/types";
import { INTENSITY_COLORS, type IntensityClass } from "@/types";

// Leaflet is imported dynamically to avoid SSR issues
// CSS loaded globally via globals.css (Turbopack-compatible)
let L: any;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

// ── NASA GIBS Tile Layers ─────────────────────────────────────────────────────
// All layers are free, no API key required
const GIBS_LAYERS = {
  "True Color (Terra/MODIS)": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "NASA GIBS / MODIS Terra",
    maxZoom: 9,
  },
  "Infrared (Aqua/MODIS)": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "NASA GIBS / MODIS Aqua",
    maxZoom: 9,
  },
  "Night Lights": {
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg",
    attribution: "NASA GIBS / VIIRS Black Marble",
    maxZoom: 8,
  },
};

type GibsLayerKey = keyof typeof GIBS_LAYERS;

interface Props {
  historicalTrack?: TrackPoint[];
  predictedTrack?: PredictedTrackPoint[];
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  height?: string;
  showSatelliteToggle?: boolean;
}

const formatTrackPopup = (pt: TrackPoint) => `
  <div style="font-family: monospace; font-size: 12px; min-width: 160px">
    <div style="font-weight: bold; margin-bottom: 4px; color: #1e293b">
      ${pt.timestamp ? new Date(pt.timestamp).toUTCString().slice(0, 22) : "N/A"}
    </div>
    <div>Lat: <b>${pt.latitude?.toFixed(2)}°N</b></div>
    <div>Lon: <b>${pt.longitude?.toFixed(2)}°E</b></div>
    ${pt.wind_kt != null ? `<div>Wind: <b>${pt.wind_kt} kt</b></div>` : ""}
    ${pt.pressure_hpa != null ? `<div>Pressure: <b>${pt.pressure_hpa} hPa</b></div>` : ""}
    ${pt.intensity_class ? `<div>Intensity: <b>${pt.intensity_class}</b></div>` : ""}
    <div style="margin-top:4px; color:#64748b; font-size:10px">
      📦 ${pt.data_type || "HISTORICAL"} — ${pt.source || "IBTrACS"}
    </div>
  </div>
`;

const formatPredictedPopup = (pt: PredictedTrackPoint) => `
  <div style="font-family: monospace; font-size: 12px; min-width: 160px">
    <div style="font-weight: bold; margin-bottom: 4px; color: #ea580c">
      ▶ PREDICTED — t+${pt.hours_ahead}h
    </div>
    <div>Lat: <b>${pt.lat?.toFixed(3)}°N</b></div>
    <div>Lon: <b>${pt.lon?.toFixed(3)}°E</b></div>
    <div style="margin-top:4px; color:#ea580c; font-size:10px">
      ⚠️ Model prediction — not an observation
    </div>
  </div>
`;

export function CycloneMap({
  historicalTrack = [],
  predictedTrack = [],
  centerLat = 15,
  centerLon = 75,
  zoom = 5,
  height = "500px",
  showSatelliteToggle = true,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const baseTileRef = useRef<any>(null);
  const satelliteTileRef = useRef<any>(null);

  const [satelliteOn, setSatelliteOn] = useState(false);
  const [activeLayer, setActiveLayer] = useState<GibsLayerKey>("True Color (Terra/MODIS)");

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined" || !L) return;
    if (mapInstance.current) return; // already initialized

    mapInstance.current = L.map(mapRef.current, {
      center: [centerLat, centerLon],
      zoom,
      zoomControl: true,
    });

    // Default OpenStreetMap base layer
    baseTileRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }
    ).addTo(mapInstance.current);
  }, []);

  // ── Toggle NASA GIBS satellite layer ──────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !L) return;

    if (satelliteOn) {
      // Remove existing satellite layer first
      if (satelliteTileRef.current) {
        mapInstance.current.removeLayer(satelliteTileRef.current);
      }
      const layerConfig = GIBS_LAYERS[activeLayer];
      satelliteTileRef.current = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
        opacity: 0.85,
        tileSize: 256,
      }).addTo(mapInstance.current);

      // Bring satellite layer below track markers
      satelliteTileRef.current.setZIndex(200);
    } else {
      if (satelliteTileRef.current) {
        mapInstance.current.removeLayer(satelliteTileRef.current);
        satelliteTileRef.current = null;
      }
    }
  }, [satelliteOn, activeLayer]);

  // ── Draw tracks ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !L) return;

    const map = mapInstance.current;

    // Clear previous track layers (keep tile layers)
    map.eachLayer((layer: any) => {
      if (!layer._url) map.removeLayer(layer);
    });

    // ── Historical Track ────────────────────────────────────────────────────
    if (historicalTrack.length > 0) {
      const latLngs = historicalTrack
        .filter((pt) => pt.latitude != null && pt.longitude != null)
        .map((pt) => [pt.latitude, pt.longitude]);

      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: "#3b82f6",
          weight: 2.5,
          opacity: 0.9,
        })
          .bindTooltip("Historical Track", { sticky: true })
          .addTo(map);
      }

      historicalTrack.forEach((pt, idx) => {
        if (pt.latitude == null || pt.longitude == null) return;
        const cls = pt.intensity_class as IntensityClass;
        const color = INTENSITY_COLORS[cls] || "#3b82f6";
        const isFirst = idx === 0;
        const isLast = idx === historicalTrack.length - 1;

        L.circleMarker([pt.latitude, pt.longitude], {
          radius: isFirst || isLast ? 8 : 5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .bindPopup(formatTrackPopup(pt))
          .addTo(map);
      });
    }

    // ── Predicted Track ─────────────────────────────────────────────────────
    if (predictedTrack.length > 0) {
      const connectorStart = historicalTrack.at(-1);
      if (connectorStart) {
        L.polyline(
          [[connectorStart.latitude, connectorStart.longitude], [predictedTrack[0].lat, predictedTrack[0].lon]],
          { color: "#f97316", weight: 2, opacity: 0.6, dashArray: "6 4" }
        ).addTo(map);
      }

      L.polyline(predictedTrack.map((pt) => [pt.lat, pt.lon]), {
        color: "#f97316",
        weight: 2.5,
        opacity: 0.8,
        dashArray: "8 5",
      })
        .bindTooltip("▶ Predicted Track (Model Output)", { sticky: true })
        .addTo(map);

      predictedTrack.forEach((pt, idx) => {
        L.circleMarker([pt.lat, pt.lon], {
          radius: idx === predictedTrack.length - 1 ? 8 : 4,
          fillColor: "#f97316",
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        })
          .bindPopup(formatPredictedPopup(pt))
          .addTo(map);
      });
    }

    // Fit bounds
    const allPoints = [
      ...historicalTrack.filter((p) => p.latitude != null).map((p) => [p.latitude, p.longitude]),
      ...predictedTrack.map((p) => [p.lat, p.lon]),
    ];
    if (allPoints.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(allPoints as any), { padding: [40, 40] });
      } catch (_) {}
    }
  }, [historicalTrack, predictedTrack]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200">
      {/* Satellite toggle controls */}
      {showSatelliteToggle && (
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          {/* Toggle button */}
          <button
            onClick={() => setSatelliteOn(!satelliteOn)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg border transition-all ${
              satelliteOn
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            🛰️ {satelliteOn ? "Satellite ON" : "Satellite OFF"}
          </button>

          {/* Layer selector — only shown when satellite is ON */}
          {satelliteOn && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
              {(Object.keys(GIBS_LAYERS) as GibsLayerKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveLayer(key)}
                  className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    activeLayer === key
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {activeLayer === key ? "✓ " : "  "}{key}
                </button>
              ))}
              <div className="px-3 py-1 border-t border-slate-100 text-[10px] text-slate-400">
                Source: NASA GIBS (Free)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} style={{ height, width: "100%" }} />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs shadow z-[400]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-0.5 bg-blue-500" />
          <span className="text-slate-600">Historical Track</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-0.5 bg-orange-500" style={{ borderTop: "2px dashed #f97316" }} />
          <span className="text-orange-600 font-medium">▶ Predicted (Model)</span>
        </div>
        {satelliteOn && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
            <span className="text-blue-500">🛰️</span>
            <span className="text-blue-600 font-medium text-[10px]">NASA GIBS · {activeLayer}</span>
          </div>
        )}
      </div>
    </div>
  );
}
