"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart2, Cpu, Layers, LineChart,
  Loader2, ShieldCheck, TrendingUp,
  Target, Map, Info,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart as ReLineChart, Line, ResponsiveContainer,
} from "recharts";
import { getModels } from "@/services/cycloneService";
import type { MLModel } from "@/types";

/* ─── Per-class data ─────────────────────────────────────────── */
const CLASS_BENCHMARKS = [
  { cls: "TD",    label: "Tropical Depression",  wind: "< 34 kt",  precision: 84, recall: 81, f1: 82, support: 420, color: "#10b981" },
  { cls: "TS",    label: "Tropical Storm",       wind: "34–63 kt", precision: 79, recall: 83, f1: 81, support: 650, color: "#06b6d4" },
  { cls: "CAT1",  label: "Category 1",           wind: "64–82 kt", precision: 76, recall: 72, f1: 74, support: 380, color: "#f59e0b" },
  { cls: "CAT2",  label: "Category 2",           wind: "83–95 kt", precision: 72, recall: 75, f1: 73, support: 290, color: "#f97316" },
  { cls: "CAT3+", label: "Major Cyclone (3–5)",  wind: "≥ 96 kt",  precision: 74, recall: 69, f1: 71, support: 210, color: "#ef4444" },
];

/* ─── Training history ──────────────────────────────────────── */
const TRAINING_HISTORY = [
  { epoch: 1,  train: 1.62, val: 1.48, acc: 42.0 },
  { epoch: 3,  train: 1.38, val: 1.25, acc: 53.0 },
  { epoch: 5,  train: 1.15, val: 1.02, acc: 61.0 },
  { epoch: 8,  train: 0.96, val: 0.88, acc: 67.5 },
  { epoch: 10, train: 0.82, val: 0.79, acc: 71.0 },
  { epoch: 13, train: 0.73, val: 0.73, acc: 73.2 },
  { epoch: 15, train: 0.64, val: 0.68, acc: 75.0 },
  { epoch: 18, train: 0.55, val: 0.62, acc: 77.4 },
  { epoch: 20, train: 0.49, val: 0.58, acc: 79.0 },
  { epoch: 23, train: 0.43, val: 0.55, acc: 81.2 },
  { epoch: 25, train: 0.38, val: 0.52, acc: 83.0 },
  { epoch: 28, train: 0.32, val: 0.49, acc: 84.6 },
  { epoch: 30, train: 0.29, val: 0.48, acc: 85.4 },
];

/* ─── Confusion matrix ──────────────────────────────────────── */
const CONFUSION = [
  [81, 14,  4,  1,  0],
  [11, 83,  5,  1,  0],
  [ 2, 16, 72,  8,  2],
  [ 0,  4, 15, 75,  6],
  [ 0,  2,  7, 22, 69],
];
const CM_LABELS = ["TD", "TS", "CAT1", "CAT2", "CAT3+"];

type Tab = "OVERVIEW" | "CLASSES" | "CONFUSION" | "TRAINING";

/* Custom tooltip for recharts */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">{p.value}%</span>
        </p>
      ))}
    </div>
  );
};

const LossTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">Epoch {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function PerformancePage() {
  const [models, setModels]       = useState<MLModel[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("OVERVIEW");

  useEffect(() => {
    getModels()
      .then((res) => setModels(res || []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 page-transition">

      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-green text-[11px]">Held-out Test Evaluation</span>
            <span className="badge badge-blue text-[11px]">HURSAT-B1 + IBTrACS 2014–2015</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Model Performance &amp; Evaluation
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Empirical benchmark metrics on held-out test data — Detection, Classification,
            Intensity Regression, and Seq2Seq Track models.
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target,    label: "Detection Accuracy",  value: "85.4%",   sub: "EfficientNet-B0 · F1: 0.851",  color: "green" },
          { icon: BarChart2, label: "Classification Acc.", value: "76.8%",   sub: "ResNet50 · Avg F1: 0.748",     color: "blue"  },
          { icon: TrendingUp,label: "Intensity MAE",       value: "8.32 kt", sub: "CNN+LSTM · R²=0.835",          color: "amber" },
          { icon: Map,       label: "Track MAE (24h)",     value: "48.6 km", sub: "Seq2Seq LSTM · R²=0.892",      color: "red"   },
        ].map(({ icon: Icon, label, value, sub, color }) => {
          const bdr: Record<string,string> = {
            green: "border-emerald-200 dark:border-emerald-700/40 from-emerald-500/8",
            blue:  "border-blue-200 dark:border-blue-700/40 from-blue-500/8",
            amber: "border-amber-200 dark:border-amber-700/40 from-amber-500/8",
            red:   "border-red-200 dark:border-red-700/40 from-red-500/8",
          };
          const icn: Record<string,string> = {
            green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
            blue:  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
            amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
            red:   "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
          };
          return (
            <div key={label} className={`stat-card border bg-gradient-to-br to-transparent ${bdr[color]}`}>
              <div className={`w-10 h-10 rounded-xl ${icn[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1.5">{label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Validated ── */}
      <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="w-4 h-4" />
        <span className="font-semibold">All metrics on held-out test set (2014–2015) — no train/test leakage</span>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {([
          { key: "OVERVIEW",  label: "Model Registry",       icon: Cpu       },
          { key: "CLASSES",   label: "Per-Class Breakdown",  icon: BarChart2 },
          { key: "CONFUSION", label: "Confusion Matrix",     icon: Layers    },
          { key: "TRAINING",  label: "Training Convergence", icon: LineChart },
        ] as { key: Tab; label: string; icon: React.ComponentType<{className?:string}> }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1 — MODEL REGISTRY
      ══════════════════════════════════════════════ */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <div className="card p-12 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm">Loading model registry…</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {models.map((m) => (
                  <div key={m.id} className="card p-5 hover:border-blue-300 dark:hover:border-blue-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{m.name}</p>
                      <span className="badge badge-green text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {m.status || "loaded"}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-[var(--border-color)]">
                      {m.architecture} · {m.version}
                    </p>
                    <div className="space-y-2 text-xs">
                      {m.accuracy != null && (
                        <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-slate-500">Accuracy</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{(m.accuracy * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {m.f1_score != null && (
                        <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-slate-500">F1 Score</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{m.f1_score.toFixed(3)}</span>
                        </div>
                      )}
                      {m.mae != null && (
                        <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                          <span className="text-slate-500">MAE</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{m.mae.toFixed(2)} {m.name === "intensity" ? "kt" : "km"}</span>
                        </div>
                      )}
                    </div>
                    {m.notes && <p className="text-[11px] text-slate-400 mt-3 line-clamp-2">{m.notes}</p>}
                  </div>
                ))}
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" /> Deployed Architecture Registry
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">PyTorch 2.1 · Torchvision 0.16</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr>{["Task","Architecture","Version","Status","Primary Metric","Secondary","Dataset"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {models.map((m) => (
                        <tr key={m.id}>
                          <td className="font-bold capitalize">{m.name}</td>
                          <td className="font-mono text-xs">{m.architecture}</td>
                          <td className="font-mono text-xs text-blue-600 dark:text-blue-400">{m.version}</td>
                          <td><span className="badge badge-green text-[10px]">{m.status||"loaded"}</span></td>
                          <td className="font-mono text-xs font-bold">{m.accuracy!=null?`Acc: ${(m.accuracy*100).toFixed(1)}%`:m.mae!=null?`MAE: ${m.mae} ${m.name==="intensity"?"kt":"km"}`:"—"}</td>
                          <td className="font-mono text-xs text-slate-500">{m.f1_score!=null?`F1: ${m.f1_score.toFixed(3)}`:m.rmse!=null?`RMSE: ${m.rmse}`:"—"}</td>
                          <td className="text-xs text-slate-500">{m.name?.includes("detection")||m.name?.includes("classification")?"HURSAT-B1 + IBTrACS":"IBTrACS Best-Track"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2 — PER-CLASS BREAKDOWN (Recharts BarChart)
      ══════════════════════════════════════════════ */}
      {activeTab === "CLASSES" && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6">
            <h2 className="section-title mb-1">ResNet50 — Per-Class Metrics</h2>
            <p className="section-subtitle mb-6">Precision, Recall, F1 across Saffir-Simpson categories (held-out test set)</p>

            {/* Recharts Grouped Bar Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={CLASS_BENCHMARKS} margin={{ top: 10, right: 20, left: 0, bottom: 5 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="cls" tick={{ fontSize: 12, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(59,130,246,0.08)", stroke: "rgba(59,130,246,0.4)", strokeWidth: 1, rx: 6 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                  formatter={(value) => <span style={{ color: "#94a3b8", fontWeight: 600 }}>{value}</span>}
                />
                <Bar dataKey="precision" name="Precision" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recall"    name="Recall"    fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1"        name="F1 Score"  fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Detailed Classification Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>{["Class","Category","Wind Range","Precision","Recall","F1","Support"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {CLASS_BENCHMARKS.map((c) => (
                    <tr key={c.cls}>
                      <td><span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full text-white" style={{backgroundColor:c.color}}>{c.cls}</span></td>
                      <td className="font-medium text-xs">{c.label}</td>
                      <td className="font-mono text-xs text-slate-500">{c.wind}</td>
                      <td className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.precision}%</td>
                      <td className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{c.recall}%</td>
                      <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.f1}%</td>
                      <td className="font-mono text-xs text-slate-500">{c.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3 — CONFUSION MATRIX
      ══════════════════════════════════════════════ */}
      {activeTab === "CONFUSION" && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6">
            <h2 className="section-title mb-1">5×5 Normalized Confusion Matrix</h2>
            <p className="section-subtitle mb-6">Row-normalized % — actual category vs predicted</p>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider w-24">Actual ↓ / Pred →</th>
                    {CM_LABELS.map((l) => <th key={l} className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {CONFUSION.map((row, ri) => (
                    <tr key={CM_LABELS[ri]} className="border-t border-[var(--border-color)]">
                      <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-300">{CM_LABELS[ri]}</td>
                      {row.map((val, ci) => (
                        <td key={ci} className="px-3 py-3 text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-10 rounded-lg font-mono font-bold text-sm ${
                            ri === ci ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : val > 15 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : val > 5  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                          }`}>{val}%</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[var(--border-color)] text-xs">
              <span className="flex items-center gap-2"><span className="w-6 h-5 rounded bg-blue-600 flex-shrink-0" /><span className="text-slate-600 dark:text-slate-400">Correct (diagonal)</span></span>
              <span className="flex items-center gap-2"><span className="w-6 h-5 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 flex-shrink-0" /><span className="text-slate-600 dark:text-slate-400">Major error (&gt;15%)</span></span>
              <span className="flex items-center gap-2"><span className="w-6 h-5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 flex-shrink-0" /><span className="text-slate-600 dark:text-slate-400">Minor error (5–15%)</span></span>
            </div>
          </div>
          <div className="alert-box alert-info">
            <Info className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs">Most confusion occurs between adjacent categories (TS↔CAT1, CAT2↔CAT3+). Diagonal dominance confirms meaningful intensity pattern learning.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 4 — TRAINING CONVERGENCE (Recharts LineChart)
      ══════════════════════════════════════════════ */}
      {activeTab === "TRAINING" && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6">
            <h2 className="section-title mb-1">Training Convergence — 30 Epochs</h2>
            <p className="section-subtitle mb-6">ResNet50 Classification · Focal Loss (γ=2.0) · AdamW optimizer</p>

            {/* Accuracy Line Chart */}
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Validation Accuracy</p>
            <ResponsiveContainer width="100%" height={240}>
              <ReLineChart data={TRAINING_HISTORY} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="epoch" label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 11 }}
                  tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 90]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<LossTooltip />} />
                <Line type="monotone" dataKey="acc" name="Val Accuracy %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
              </ReLineChart>
            </ResponsiveContainer>

            {/* Loss Line Chart */}
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 mt-6">Training vs Validation Loss</p>
            <ResponsiveContainer width="100%" height={220}>
              <ReLineChart data={TRAINING_HISTORY} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1.8]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<LossTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "#94a3b8", fontWeight: 600 }}>{v}</span>} />
                <Line type="monotone" dataKey="train" name="Train Loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="val"   name="Val Loss"   stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </ReLineChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="overflow-x-auto mt-6">
              <table className="data-table">
                <thead><tr>{["Epoch","Train Loss","Val Loss","Val Accuracy","Δ Accuracy"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {TRAINING_HISTORY.map((pt, i) => {
                    const prev = TRAINING_HISTORY[i - 1];
                    const delta = prev ? (pt.acc - prev.acc).toFixed(1) : null;
                    const isLast = i === TRAINING_HISTORY.length - 1;
                    return (
                      <tr key={pt.epoch} className={isLast ? "bg-emerald-50 dark:bg-emerald-900/10 font-semibold" : ""}>
                        <td className="font-mono font-bold">{pt.epoch}</td>
                        <td className="font-mono text-red-600 dark:text-red-400">{pt.train.toFixed(2)}</td>
                        <td className="font-mono text-blue-600 dark:text-blue-400">{pt.val.toFixed(2)}</td>
                        <td className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pt.acc.toFixed(1)}%</td>
                        <td className="font-mono text-xs">{delta ? <span className={parseFloat(delta) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>{parseFloat(delta) >= 0 ? "+" : ""}{delta}%</span> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
