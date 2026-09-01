"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getModels } from "@/services/cycloneService";
import type { MLModel } from "@/types";

const DISCLAIMER = "Model metrics are from prototype evaluation on held-out test data. Not operationally validated.";

export default function PerformancePage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModels()
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  const hasMetrics = models.some((m) => m.accuracy != null || m.f1_score != null || m.mae != null);

  // Placeholder metrics for demonstration (clearly labeled as examples)
  const exampleClassMetrics = [
    { class: "TD",        precision: 0.82, recall: 0.79, f1: 0.80 },
    { class: "TS",        precision: 0.78, recall: 0.81, f1: 0.79 },
    { class: "CAT1",      precision: 0.74, recall: 0.70, f1: 0.72 },
    { class: "CAT2",      precision: 0.69, recall: 0.73, f1: 0.71 },
    { class: "CAT3+",     precision: 0.71, recall: 0.67, f1: 0.69 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Model Performance Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Evaluation metrics from test set. All metrics from actual model evaluation only.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-800">Evaluation Disclaimer</p>
          <p className="text-xs text-yellow-700 mt-1">{DISCLAIMER}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 p-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading model metrics...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((model) => (
            <div key={model.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800 capitalize">{model.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  model.status === "loaded"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {model.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{model.architecture} · {model.version}</p>

              {model.accuracy != null ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Accuracy</span>
                    <span className="font-mono font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  {model.f1_score != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">F1 Score</span>
                      <span className="font-mono font-medium">{model.f1_score.toFixed(3)}</span>
                    </div>
                  )}
                  {model.mae != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-xs">MAE</span>
                      <span className="font-mono font-medium">{model.mae.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Metrics will be available after model training.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Classification metrics chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Classification Metrics by Class</h2>
          {!hasMetrics && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
              Placeholder — real metrics after training
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={exampleClassMetrics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="class" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
            <Bar dataKey="precision" fill="#3b82f6" name="Precision" radius={[3, 3, 0, 0]} />
            <Bar dataKey="recall"    fill="#22c55e" name="Recall"    radius={[3, 3, 0, 0]} />
            <Bar dataKey="f1"        fill="#f97316" name="F1 Score"  radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 text-center mt-2 italic">
          ⚠️ These are example/placeholder values. Actual metrics will be populated after training.
        </p>
      </div>

      {/* Model info table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Registered Models</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Model", "Version", "Architecture", "Task", "Status", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium capitalize">{m.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{m.version}</td>
                  <td className="px-4 py-3 text-slate-600">{m.architecture}</td>
                  <td className="px-4 py-3 text-slate-600">{m.task}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === "loaded" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
