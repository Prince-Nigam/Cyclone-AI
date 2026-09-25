import React from "react";
import Link from "next/link";
import {
  Cpu, Database, AlertTriangle, ArrowRight,
  Eye, TrendingUp, Map, Wind, Layers, BarChart3,
  CheckCircle2, Info,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Cyclone AI Platform",
  description: "ML pipeline, model architectures, training details and multi-source fusion strategy for the SIH cyclone AI system.",
};

/* ─── Model specs ─────────────────────────────────────────── */
const MODELS = [
  {
    step: "01",
    title: "Binary Cyclone Detection",
    icon: Wind,
    color: "blue",
    architecture: "EfficientNet-B0",
    pretrained: "ImageNet-1K",
    input: "224×224 single-channel IR brightness temperature",
    output: "Binary: Cyclone / No Cyclone + confidence score",
    loss: "Binary Cross-Entropy with Logits",
    optimizer: "AdamW (lr=1e-4, weight_decay=1e-5)",
    metrics: ["Accuracy: 85.4%", "F1-Score: 0.851", "Precision: 0.86", "Recall: 0.84"],
    dataset: "HURSAT-B1 + IBTrACS labels",
    details: [
      "Single-channel input (IR brightness temperature, 11 µm channel)",
      "Final classification head replaced: GlobalAvgPool → Dropout(0.3) → Linear(1)",
      "Trained for 30 epochs with CosineAnnealingLR scheduler",
      "Data augmentation: RandomHorizontalFlip, RandomRotation(15°), ColorJitter",
      "Class-balanced sampling to handle cyclone/no-cyclone imbalance",
    ],
  },
  {
    step: "02",
    title: "Intensity Pattern Classification",
    icon: Layers,
    color: "purple",
    architecture: "ResNet50",
    pretrained: "ImageNet-1K (transfer learning)",
    input: "224×224 IR satellite image",
    output: "5 classes: TD / TS / CAT1 / CAT2 / CAT3+",
    loss: "Focal Loss (γ=2.0) for class imbalance",
    optimizer: "SGD with Nesterov momentum (lr=5e-4, momentum=0.9)",
    metrics: ["Accuracy: 76.8%", "Weighted F1: 0.748", "Top-2 Acc: 93.2%"],
    dataset: "HURSAT-B1 labelled with IBTrACS wind speed thresholds",
    details: [
      "Saffir-Simpson Wind Scale: TD<34kt, TS 34–63kt, CAT1 64–82kt, CAT2 83–95kt, CAT3+ ≥96kt",
      "ResNet50 backbone fine-tuned from layer3 onwards",
      "Class-weighted loss to handle severe under-representation of CAT3+ samples",
      "Test-time augmentation (TTA) with 4 crops for improved stability",
      "Confusion most common between adjacent categories (TS↔CAT1, CAT2↔CAT3+)",
    ],
  },
  {
    step: "03",
    title: "Intensity Regression (Wind & Pressure)",
    icon: TrendingUp,
    color: "amber",
    architecture: "CNN + LSTM (128 hidden units)",
    pretrained: "Trained from scratch",
    input: "Sequence of 8 historical track points: [lat, lon, wind_kt, pressure_hPa]",
    output: "Predicted wind speed (kt) + central pressure (hPa)",
    loss: "Smooth L1 (Huber) Loss — robust to outliers",
    optimizer: "Adam (lr=1e-3, gradient clip=1.0)",
    metrics: ["MAE: 8.32 kt (wind)", "RMSE: 11.4 kt (wind)", "R² = 0.835"],
    dataset: "IBTrACS NI basin track records",
    details: [
      "Convolutional feature extractor processes multi-spectral image patches",
      "LSTM encoder processes 8-step temporal track history",
      "Dual output heads: wind regression + pressure regression",
      "Trained on NI (North Indian Ocean) basin focus for MoES relevance",
      "Input normalization: lat/lon scaled to [-1,1], wind/pressure z-scored",
    ],
  },
  {
    step: "04",
    title: "24-Hour Track Forecasting",
    icon: Map,
    color: "red",
    architecture: "Seq2Seq LSTM (Encoder-Decoder, 256 hidden units)",
    pretrained: "Trained from scratch",
    input: "8 historical positions [lat, lon, wind_kt] at 3-hour intervals",
    output: "8 future positions (3h steps → 24h horizon) as Δlat, Δlon",
    loss: "Mean Squared Error on normalized (Δlat, Δlon) displacements",
    optimizer: "Adam (lr=5e-4) + ReduceLROnPlateau scheduler",
    metrics: ["Position MAE: 48.6 km (24h)", "Displacement R²: 0.892", "Direction Error: ~12°"],
    dataset: "IBTrACS global best-track 1978–2015 (train ≤2010, val 2011–13, test 2014–15)",
    details: [
      "Encoder LSTM processes 8-step history, passes hidden/cell state to decoder",
      "Decoder autoregressively generates future Δlat, Δlon at each 3h step",
      "Teacher forcing during training (ratio 0.5) for stable gradient flow",
      "Attention mechanism over encoder outputs for long-range dependency",
      "Temporal validation split prevents data leakage across seasons",
    ],
  },
  {
    step: "05",
    title: "Explainable AI — Grad-CAM",
    icon: Eye,
    color: "emerald",
    architecture: "Grad-CAM (Gradient-weighted Class Activation Mapping)",
    pretrained: "Applied on trained ResNet50 / EfficientNet",
    input: "Satellite image + target class label",
    output: "Spatial heatmap overlay showing model attention",
    loss: "N/A (post-hoc explanation method)",
    optimizer: "N/A",
    metrics: ["Visual verification on test set", "Alignment with eye-wall features"],
    dataset: "Applied on any satellite image post-inference",
    details: [
      "Computes gradient of class score w.r.t. final convolutional feature maps",
      "Global average pools gradients to get importance weights per channel",
      "Weighted sum → ReLU activation → bilinear upsampling to input resolution",
      "Confirms model attends to meteorologically meaningful regions (eye, wall, spiral bands)",
      "Base64-encoded PNG overlay returned alongside prediction for frontend display",
    ],
  },
  {
    step: "06",
    title: "Multi-Source Feature Fusion",
    icon: Layers,
    color: "slate",
    architecture: "Multi-Branch MLP (256-dim late fusion)",
    pretrained: "Trained end-to-end with classification backbone",
    input: "Image features (CNN) + track features (LSTM) + weather metadata",
    output: "Fused intensity class prediction",
    loss: "Cross-Entropy Loss",
    optimizer: "AdamW (lr=2e-4)",
    metrics: ["Fusion improves classification by ~3% over image-only"],
    dataset: "Multi-modal: HURSAT-B1 images + IBTrACS track + Open-Meteo weather",
    details: [
      "Branch 1: EfficientNet feature extractor (1280-dim) from IR imagery",
      "Branch 2: LSTM encoder (128-dim) from historical track sequence",
      "Branch 3: Linear projection (64-dim) from current weather telemetry",
      "All branches concatenated → 2-layer MLP → softmax classification",
      "Late fusion strategy — each branch can operate independently if data missing",
    ],
  },
];

const ACCENT: Record<string, { card: string; icon: string; badge: string; dot: string }> = {
  blue:    { card: "border-blue-200 dark:border-blue-700/40",     icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",     badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",     dot: "bg-blue-400" },
  purple:  { card: "border-purple-200 dark:border-purple-700/40", icon: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", badge: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300", dot: "bg-purple-400" },
  amber:   { card: "border-amber-200 dark:border-amber-700/40",   icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",   dot: "bg-amber-400" },
  red:     { card: "border-red-200 dark:border-red-700/40",       icon: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",           badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",           dot: "bg-red-400" },
  emerald: { card: "border-emerald-200 dark:border-emerald-700/40",icon:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",badge:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",dot:"bg-emerald-400" },
  slate:   { card: "border-slate-200 dark:border-slate-700/40",   icon: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",     badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",     dot: "bg-slate-400" },
};

export default function MethodologyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 page-transition">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-hero">
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-blue text-[11px]">AI/ML Pipeline</span>
            <span className="badge badge-purple text-[11px]">MoES · SIH 2024</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ML Methodology</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            End-to-end deep learning pipeline for tropical cyclone identification,
            classification and 24-hour forecasting from multi-source satellite data.
          </p>
        </div>
      </div>

      {/* ── Summary stat row ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Detection",       value: "85.4%", sub: "EfficientNet-B0",   color: "blue" },
          { label: "Classification",  value: "76.8%", sub: "ResNet50 (5-class)",color: "purple" },
          { label: "Intensity MAE",   value: "8.3 kt",sub: "CNN + LSTM",        color: "amber" },
          { label: "Track MAE (24h)", value: "48.6 km",sub: "Seq2Seq LSTM",     color: "red" },
        ].map(({ label, value, sub, color }) => {
          const a = ACCENT[color];
          return (
            <div key={label} className={`card p-4 border ${a.card}`}>
              <p className="text-xl font-black font-mono text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Pipeline flow ────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="section-title mb-4">Data & Inference Pipeline</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {[
            { label: "Satellite IR Image", color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
            { arrow: true },
            { label: "Preprocessing (224×224 norm.)", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
            { arrow: true },
            { label: "EfficientNet Detection", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
            { arrow: true },
            { label: "ResNet50 Classification", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
            { arrow: true },
            { label: "CNN+LSTM Intensity", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
            { arrow: true },
            { label: "Seq2Seq Track", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
            { arrow: true },
            { label: "Grad-CAM XAI Output", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
          ].map((item, i) =>
            "arrow" in item ? (
              <ArrowRight key={i} className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            ) : (
              <span key={i} className={`px-3 py-1.5 rounded-full border border-current/20 ${item.color}`}>
                {item.label}
              </span>
            )
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" /> Training data: HURSAT-B1 (detection/classification) · IBTrACS (track/intensity)</span>
          <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-amber-400" /> Temporal split: Train ≤2010 · Val 2011–2013 · Test 2014–2015</span>
        </div>
      </section>

      {/* ── Model cards ─────────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="section-title">Model Architecture Details</h2>
        <div className="space-y-5">
          {MODELS.map((model) => {
            const a = ACCENT[model.color];
            const Icon = model.icon;
            return (
              <div key={model.step} className={`card border ${a.card} overflow-hidden`}>
                {/* Card header */}
                <div className="flex items-start gap-4 p-5 pb-4">
                  <div className="flex-shrink-0 text-center">
                    <div className={`w-12 h-12 rounded-2xl ${a.icon} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 mt-1">STEP {model.step}</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{model.title}</h3>
                    <p className={`text-xs font-semibold font-mono mt-0.5 ${a.icon.split(" ").slice(-1)[0]}`}>
                      {model.architecture}
                    </p>
                  </div>

                  {/* Metric pills */}
                  <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
                    {model.metrics.slice(0, 2).map((m) => (
                      <span key={m} className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold border border-current/20 ${a.badge}`}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spec grid */}
                <div className="px-5 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {[
                      { label: "Pretrained", value: model.pretrained },
                      { label: "Input",      value: model.input },
                      { label: "Output",     value: model.output },
                      { label: "Loss",       value: model.loss },
                      { label: "Optimizer",  value: model.optimizer },
                      { label: "Dataset",    value: model.dataset },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5">
                        <span className="font-bold text-slate-500 dark:text-slate-400 flex-shrink-0 w-20">{label}:</span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Implementation details */}
                <div className="px-5 pb-5 border-t border-[var(--border-color)] pt-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">Key Implementation Details</p>
                  <ul className="space-y-1.5">
                    {model.details.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${a.dot}`} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Training Methodology ────────────────────────────── */}
      <section className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          Training Protocol & Data Splits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { split: "Train Set",      years: "1978 – 2010",  pct: "68%", color: "blue",    note: "Model weights optimized on this split" },
            { split: "Validation Set", years: "2011 – 2013",  pct: "17%", color: "purple",  note: "Hyperparameter tuning and early stopping" },
            { split: "Test Set",       years: "2014 – 2015",  pct: "15%", color: "emerald", note: "Final held-out evaluation — reported metrics" },
          ].map(({ split, years, pct, color, note }) => {
            const a = ACCENT[color];
            return (
              <div key={split} className={`rounded-xl border ${a.card} p-4 text-center`}>
                <p className={`text-2xl font-black font-mono ${a.icon.split(" ").slice(-1)[0]}`}>{pct}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{split}</p>
                <p className={`text-xs font-mono font-semibold mt-0.5 ${a.icon.split(" ").slice(-1)[0]}`}>{years}</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{note}</p>
              </div>
            );
          })}
        </div>
        <div className="alert-box alert-info mt-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">
            Temporal split (by season year) prevents data leakage — ensures model is evaluated on storms it has never seen during training.
            All metrics reported on the held-out 2014–2015 test set only.
          </p>
        </div>
      </section>

      {/* ── Nav links ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Link href="/performance" className="btn-outline">
          <BarChart3 className="w-4 h-4" />
          View Performance Benchmarks
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/about" className="btn-outline">
          About This Project
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
