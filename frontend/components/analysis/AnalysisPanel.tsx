"use client";

import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import type { AnalysisResult, IntensityClass } from "@/types";
import { INTENSITY_LABELS, INTENSITY_WIND_RANGES } from "@/types";

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

export function AnalysisPanel({ result, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
        <p className="text-sm font-medium">Running AI analysis...</p>
        <p className="text-xs mt-1">Detection → Classification → Prediction</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">Analysis Failed</span>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <AlertTriangle className="w-10 h-10 mb-3 text-slate-300" />
        <p className="text-sm">Upload a satellite image to start analysis</p>
      </div>
    );
  }

  const det = result.detection;
  const cls = result.classification;
  const intensity = result.intensity;
  const track = result.track;
  const xai = result.explainability;
  const dataType = result.metadata?.data_type || "PREDICTED";

  return (
    <div className="space-y-4">

      {/* Data type warning */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-slate-700">Analysis Results</span>
        <DataTypeBadge type={dataType as any} size="md" />
      </div>

      {/* Detection */}
      {det && (
        <div className={`p-4 rounded-lg border ${
          det.detected
            ? "bg-red-50 border-red-200"
            : "bg-green-50 border-green-200"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {det.detected
              ? <XCircle className="w-5 h-5 text-red-600" />
              : <CheckCircle className="w-5 h-5 text-green-600" />
            }
            <span className="font-semibold text-sm">
              {det.detected ? "⚠️ Cyclone Detected" : "✓ No Cyclone Detected"}
            </span>
          </div>
          {det.confidence !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Model Confidence</span>
                <span className="font-mono">{(det.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${det.detected ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${(det.confidence * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
          )}
          {det.disclaimer && (
            <p className="text-xs text-slate-500 mt-2 italic">{det.disclaimer}</p>
          )}
        </div>
      )}

      {/* Classification */}
      {cls && cls.pattern && (
        <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pattern Classification</p>
          <div className="flex items-center gap-3 mb-2">
            <IntensityBadge intensity={cls.pattern as IntensityClass} />
            <div>
              <p className="text-sm font-medium text-slate-800">{cls.pattern_label}</p>
              <p className="text-xs text-slate-500">{cls.wind_range_kt}</p>
            </div>
          </div>

          {/* Probability bars */}
          {cls.probabilities && (
            <div className="space-y-1 mt-3">
              {Object.entries(cls.probabilities).map(([cls_name, prob]) => (
                <div key={cls_name} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-slate-600 font-mono">{cls_name}</span>
                  <div className="flex-1 bg-slate-200 rounded h-1.5">
                    <div
                      className="h-1.5 rounded bg-blue-500 transition-all"
                      style={{ width: `${(prob * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono w-10 text-right">
                    {(prob * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intensity */}
      {intensity?.available !== false && intensity?.predicted_wind_kt && (
        <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
          <p className="text-xs font-semibold text-orange-700 uppercase mb-2">Intensity Prediction</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">Max Wind Speed</p>
              <p className="text-xl font-bold text-orange-700 font-mono">
                {intensity.predicted_wind_kt?.toFixed(0)} <span className="text-sm font-normal">kt</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Central Pressure</p>
              <p className="text-xl font-bold text-orange-700 font-mono">
                {intensity.predicted_pressure_hpa?.toFixed(0)} <span className="text-sm font-normal">hPa</span>
              </p>
            </div>
          </div>
          {intensity.disclaimer && (
            <p className="text-xs text-orange-600 mt-2 italic">{intensity.disclaimer}</p>
          )}
        </div>
      )}

      {/* Track Summary */}
      {track?.available !== false && track?.predicted_track && (
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Track Prediction</p>
          <p className="text-sm text-blue-800">
            {track.predicted_track.length} steps predicted
            ({track.prediction_horizon_hours}h horizon)
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Final position: {track.predicted_track.at(-1)?.lat.toFixed(2)}°N,{" "}
            {track.predicted_track.at(-1)?.lon.toFixed(2)}°E
          </p>
          {track.disclaimer && (
            <p className="text-xs text-blue-500 mt-2 italic">{track.disclaimer}</p>
          )}
        </div>
      )}

      {/* Grad-CAM */}
      {xai?.available !== false && xai?.heatmap_base64 && (
        <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-700 uppercase mb-2">
            Explainable AI — {xai.method}
          </p>
          <img
            src={xai.heatmap_base64}
            alt="Grad-CAM attention heatmap"
            className="w-full rounded border border-slate-200"
          />
          <p className="text-xs text-slate-500 mt-2 italic">{xai.disclaimer}</p>
        </div>
      )}

      {/* Inference time */}
      {result.metadata?.inference_time_ms && (
        <p className="text-xs text-slate-400 text-right font-mono">
          Inference: {result.metadata.inference_time_ms}ms
        </p>
      )}
    </div>
  );
}
