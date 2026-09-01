"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, Database } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { predictIntensity, predictTrack, getCyclones, getCyclone } from "@/services/cycloneService";
import type { IntensityClass, IntensityResult, PredictedTrackPoint, Cyclone } from "@/types";

const CycloneMap = dynamic(
  () => import("@/components/map/CycloneMap").then((m) => m.CycloneMap),
  { ssr: false, loading: () => <div className="h-80 bg-slate-100 rounded-xl animate-pulse" /> }
);

interface HistPoint { lat: string; lon: string; wind_kt: string; pressure_hpa: string; }

const DEFAULT_HISTORY: HistPoint[] = [
  { lat: "12.0", lon: "65.0", wind_kt: "45",  pressure_hpa: "998" },
  { lat: "12.8", lon: "65.8", wind_kt: "55",  pressure_hpa: "990" },
  { lat: "13.6", lon: "66.5", wind_kt: "65",  pressure_hpa: "982" },
  { lat: "14.3", lon: "67.0", wind_kt: "75",  pressure_hpa: "975" },
];

export default function PredictionPage() {
  const [history, setHistory] = useState<HistPoint[]>(DEFAULT_HISTORY);
  const [intensityResult, setIntensityResult] = useState<IntensityResult | null>(null);
  const [predictedTrack, setPredictedTrack] = useState<PredictedTrackPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [cyclones, setCyclones] = useState<Cyclone[]>([]);
  const [loadingCyclone, setLoadingCyclone] = useState(false);

  // Load cyclone list for "Load from Historical" dropdown
  useEffect(() => {
    getCyclones({ basin: "NI", limit: 20 })
      .then((res) => setCyclones(res.cyclones))
      .catch(() => {});
  }, []);

  const loadFromHistorical = async (id: string) => {
    if (!id) return;
    setLoadingCyclone(true);
    try {
      const detail = await getCyclone(id);
      if (detail.track && detail.track.length >= 2) {
        const pts = detail.track.slice(-8).map((pt) => ({
          lat: String(pt.latitude),
          lon: String(pt.longitude),
          wind_kt: String(pt.wind_kt || 50),
          pressure_hpa: String(pt.pressure_hpa || 990),
        }));
        setHistory(pts);
        setIntensityResult(null);
        setPredictedTrack([]);
        toast.success(`Loaded ${detail.name} track (${pts.length} points)`);
      } else {
        toast.error("This cyclone has insufficient track data");
      }
    } catch {
      toast.error("Failed to load cyclone track");
    } finally {
      setLoadingCyclone(false);
    }
  };

  const addRow = () =>
    setHistory([...history, { lat: "", lon: "", wind_kt: "", pressure_hpa: "" }]);

  const removeRow = (i: number) =>
    setHistory(history.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof HistPoint, val: string) => {
    const updated = [...history];
    updated[i] = { ...updated[i], [field]: val };
    setHistory(updated);
  };

  const validate = () => {
    for (const h of history) {
      if (!h.lat || !h.lon || !h.wind_kt || !h.pressure_hpa) return false;
      if (isNaN(+h.lat) || isNaN(+h.lon) || isNaN(+h.wind_kt) || isNaN(+h.pressure_hpa)) return false;
    }
    return history.length >= 2;
  };

  const runPrediction = async () => {
    if (!validate()) { toast.error("Please fill all fields (min 2 rows)"); return; }

    setLoading(true);
    const parsed = history.map((h) => ({
      lat: +h.lat, lon: +h.lon,
      wind_kt: +h.wind_kt, pressure_hpa: +h.pressure_hpa,
    }));

    try {
      const [intensRes, trackRes] = await Promise.allSettled([
        predictIntensity(parsed),
        predictTrack(parsed, 24),
      ]);

      if (intensRes.status === "fulfilled") setIntensityResult(intensRes.value);
      if (trackRes.status === "fulfilled" && trackRes.value.predicted_track)
        setPredictedTrack(trackRes.value.predicted_track);

      toast.success("Predictions generated");
    } catch (e: any) {
      toast.error(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const historicalForMap = history
    .filter((h) => h.lat && h.lon)
    .map((h) => ({
      latitude: +h.lat,
      longitude: +h.lon,
      wind_kt: +h.wind_kt,
      pressure_hpa: +h.pressure_hpa,
      data_type: "HISTORICAL" as const,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Intensity & Track Prediction</h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter historical track data to predict future intensity and track.
          All outputs are labeled as <DataTypeBadge type="PREDICTED" className="inline-flex" />.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Input */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Historical Track Input</h2>
              <span className="text-xs text-slate-400">{history.length} rows · min 2</span>
            </div>

            {/* Load from Historical dropdown */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                onChange={(e) => loadFromHistorical(e.target.value)}
                defaultValue=""
                disabled={loadingCyclone}
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="">Load from Historical Cyclone...</option>
                {cyclones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.season}) — {c.peak_intensity}
                  </option>
                ))}
              </select>
              {loadingCyclone && <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="text-left pb-2 pr-2">Lat°N</th>
                    <th className="text-left pb-2 pr-2">Lon°E</th>
                    <th className="text-left pb-2 pr-2">Wind (kt)</th>
                    <th className="text-left pb-2 pr-2">Pres (hPa)</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {history.map((row, i) => (
                    <tr key={i}>
                      {(["lat", "lon", "wind_kt", "pressure_hpa"] as const).map((field) => (
                        <td key={field} className="pr-2 py-1">
                          <input
                            type="number"
                            value={row[field]}
                            onChange={(e) => updateRow(i, field, e.target.value)}
                            className="w-20 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td>
                        <button onClick={() => removeRow(i)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
              <Plus className="w-3 h-3" /> Add row
            </button>
          </div>

          <button
            onClick={runPrediction}
            disabled={loading || history.length < 2}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Predicting...</> : "Run Prediction"}
          </button>

          {/* Intensity Result */}
          {intensityResult && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-orange-800 text-sm">Intensity Prediction</h3>
                <DataTypeBadge type={(intensityResult.data_type as any) || "PREDICTED"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Predicted Wind</p>
                  <p className="text-2xl font-bold text-orange-700 font-mono">
                    {intensityResult.predicted_wind_kt?.toFixed(0)}
                    <span className="text-sm font-normal ml-1">kt</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Predicted Pressure</p>
                  <p className="text-2xl font-bold text-orange-700 font-mono">
                    {intensityResult.predicted_pressure_hpa?.toFixed(0)}
                    <span className="text-sm font-normal ml-1">hPa</span>
                  </p>
                </div>
              </div>
              {intensityResult.intensity_class && (
                <div className="mt-3">
                  <IntensityBadge intensity={intensityResult.intensity_class as IntensityClass} />
                </div>
              )}
              {intensityResult.disclaimer && (
                <p className="text-xs text-orange-600 mt-2 italic">{intensityResult.disclaimer}</p>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 text-sm mb-3">
              Track Visualization
              {predictedTrack.length > 0 && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  + {predictedTrack.length} predicted steps
                </span>
              )}
            </h2>
            <CycloneMap
              historicalTrack={historicalForMap}
              predictedTrack={predictedTrack}
              height="380px"
            />
          </div>

          {predictedTrack.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 text-sm">Predicted Positions</h3>
                <DataTypeBadge type="PREDICTED" />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {predictedTrack.map((pt) => (
                  <div key={pt.step} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-orange-600 font-medium">t+{pt.hours_ahead}h</span>
                    <span className="font-mono text-slate-700">{pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                ⚠️ Model predictions — not official forecasts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
