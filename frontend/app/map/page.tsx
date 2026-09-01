"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { getCyclone, getCyclones, predictTrack } from "@/services/cycloneService";
import type { Cyclone, IntensityClass, PredictedTrackPoint } from "@/types";

const CycloneMap = dynamic(
  () => import("@/components/map/CycloneMap").then((m) => m.CycloneMap),
  { ssr: false, loading: () => <div className="h-full bg-slate-100 rounded-xl animate-pulse" /> }
);

export default function MapPage() {
  const [cyclones, setCyclones] = useState<Cyclone[]>([]);
  const [selected, setSelected] = useState<Cyclone | null>(null);
  const [predictedTrack, setPredictedTrack] = useState<PredictedTrackPoint[]>([]);
  const [predicting, setPredicting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCyclones({ basin: "NI", limit: 10 })
      .then((res) => {
        setCyclones(res.cyclones);
        if (res.cyclones[0]) loadCyclone(res.cyclones[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadCyclone = async (id: string) => {
    const detail = await getCyclone(id);
    setSelected(detail);
    setPredictedTrack([]);

    // Run track prediction only if enough track points exist
    if (detail.track && detail.track.length >= 2) {
      setPredicting(true); // only set true when we actually predict
      try {
        const history = detail.track.slice(-8).map((pt) => ({
          lat: pt.latitude, lon: pt.longitude,
          wind_kt: pt.wind_kt || 50, pressure_hpa: pt.pressure_hpa || 990,
        }));
        const result = await predictTrack(history);
        if (result.predicted_track) setPredictedTrack(result.predicted_track);
      } catch {
        setPredictedTrack([]);
      } finally {
        setPredicting(false); // always reset
      }
    }
    // If track < 2 points, predicting stays false — bug fixed
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interactive Cyclone Map</h1>
          <p className="text-slate-500 text-sm mt-1">
            Historical tracks (<DataTypeBadge type="HISTORICAL" className="inline-flex" />) and
            model predictions (<DataTypeBadge type="PREDICTED" className="inline-flex" />).
          </p>
        </div>

        {/* Cyclone selector */}
        <select
          onChange={(e) => loadCyclone(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white min-w-48"
        >
          {cyclones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.season}) — {c.peak_intensity}
            </option>
          ))}
        </select>
      </div>

      {/* NASA GIBS info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm">
        <span className="text-2xl">🛰️</span>
        <div>
          <span className="font-semibold text-blue-800">Live NASA Satellite Imagery available</span>
          <span className="text-blue-600 ml-2">— Click the <b>Satellite OFF</b> button on the map (top-right) to enable real satellite view.</span>
        </div>
        <a
          href="/live-satellite"
          className="ml-auto text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Full Live View →
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Info panel */}
        <div className="lg:col-span-1 space-y-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <h2 className="font-bold text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.id}</p>
              </div>

              <IntensityBadge intensity={(selected.peak_intensity || "UNKNOWN") as IntensityClass} />
              <DataTypeBadge type={selected.data_type || "HISTORICAL"} />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Basin</span>
                  <span className="font-medium">{selected.basin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Season</span>
                  <span className="font-medium">{selected.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peak Wind</span>
                  <span className="font-medium font-mono">{selected.peak_wind_kt} kt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Track Points</span>
                  <span className="font-medium">{selected.track?.length || 0}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-1">Track Prediction</p>
                {predicting ? (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Predicting...
                  </div>
                ) : predictedTrack.length > 0 ? (
                  <div>
                    <DataTypeBadge type="PREDICTED" size="sm" />
                    <p className="text-xs text-slate-500 mt-1">
                      {predictedTrack.length} steps · {predictedTrack.at(-1)?.hours_ahead}h ahead
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No prediction available</p>
                )}
              </div>

              <p className="text-xs text-slate-400 italic">
                Source: {selected.source || "IBTrACS"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <p className="text-sm text-slate-500">Select a cyclone</p>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <CycloneMap
            historicalTrack={selected?.track}
            predictedTrack={predictedTrack}
            height="540px"
          />
        </div>
      </div>
    </div>
  );
}
