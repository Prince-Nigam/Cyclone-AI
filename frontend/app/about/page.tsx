import React from "react";
import Link from "next/link";
import {
  AlertTriangle, BookOpen, Database, ExternalLink,
  Globe2, Cpu, Github, Wind, CheckCircle2,
  Layers, BarChart3, Map, Satellite, TrendingUp, Eye, Clock,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Cyclone AI Platform",
  description: "About the SIH 2024 AI Cyclone Platform — MoES problem statement, approach, team and disclaimer.",
};

const MODULES = [
  { icon: Satellite, label: "Cyclone Detection",    detail: "EfficientNet-B0 binary IR classifier",        href: "/detection" },
  { icon: Wind,      label: "Pattern Classification",detail: "ResNet50 5-class Saffir-Simpson intensity",  href: "/satellite" },
  { icon: TrendingUp,label: "Intensity Prediction", detail: "CNN+LSTM wind speed & pressure regression",   href: "/prediction" },
  { icon: Map,       label: "Track Forecasting",    detail: "Seq2Seq LSTM 24h future path (3h steps)",     href: "/prediction" },
  { icon: Eye,       label: "Grad-CAM XAI",         detail: "Explainability heatmap on conv activations",  href: "/satellite" },
  { icon: Globe2,    label: "Live Tracking",         detail: "Real-time GDACS global cyclone alerts",       href: "/live-satellite" },
  { icon: Clock,     label: "Historical Archive",   detail: "IBTrACS best-track data 1978–2015",           href: "/historical" },
  { icon: BarChart3, label: "Model Performance",    detail: "Benchmarks, confusion matrix, ROC curves",    href: "/performance" },
];

const DATA_SOURCES = [
  { name: "GDACS RSS Feed",    type: "OBSERVED",  desc: "Global Disaster Alert and Coordination System — live tropical cyclone events.", href: "https://www.gdacs.org" },
  { name: "IBTrACS",           type: "HISTORICAL",desc: "NOAA International Best Track Archive for Climate Stewardship (1841–2022).", href: "https://www.ncei.noaa.gov/products/international-best-track-archive" },
  { name: "HURSAT-B1",         type: "HISTORICAL",desc: "Hurricane Satellite data — IR brightness temperature for model training.", href: "https://www.ncei.noaa.gov/products/hursat" },
  { name: "Open-Meteo Marine", type: "OBSERVED",  desc: "Free weather API — current wind, pressure, and temperature at any coordinate.", href: "https://open-meteo.com" },
  { name: "NASA GIBS",         type: "OBSERVED",  desc: "Global Imagery Browse Services — MODIS/VIIRS true-colour and IR satellite tiles.", href: "https://gibs.earthdata.nasa.gov" },
  { name: "INSAT-3D / Kalpana-1", type: "HISTORICAL", desc: "ISRO geostationary Indian Ocean imagery used in HURSAT archive compilation.", href: "https://www.isro.gov.in" },
];

const TYPE_COLORS: Record<string, string> = {
  OBSERVED:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50",
  HISTORICAL: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 page-transition">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="page-hero">
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-blue text-[11px] tracking-wider">Ministry of Earth Sciences · MoES</span>
            <span className="badge badge-green text-[11px]">SIH 2024</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">About This Project</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg">
            AI/ML Tropical Cyclone Identification, Classification and Prediction Platform —
            Smart India Hackathon 2024.
          </p>
        </div>
      </div>

      {/* ── Problem Statement ───────────────────────────────── */}
      <section className="card p-7 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Problem Statement</h2>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
            Organization: Ministry of Earth Sciences (MoES) · Category: Software · Theme: Disaster Management
          </p>
          <blockquote className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed font-medium italic border-l-4 border-blue-400 pl-4">
            "To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system
            for identification, classification, and prediction of different tropical cyclone
            patterns using multi-source satellite data."
          </blockquote>
        </div>

        {/* Our solution checklist */}
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Our Solution Covers:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { check: "Cyclone Identification",   detail: "Binary detection from satellite IR imagery (EfficientNet-B0)" },
              { check: "Pattern Classification",   detail: "5-class Saffir-Simpson intensity (ResNet50)" },
              { check: "Intensity Prediction",     detail: "Wind speed & pressure regression (CNN+LSTM)" },
              { check: "Track Forecasting",        detail: "24-hour future path prediction (Seq2Seq LSTM)" },
              { check: "Multi-source Data Fusion", detail: "GDACS, IBTrACS, Open-Meteo, NASA GIBS" },
              { check: "Explainable AI (XAI)",     detail: "Grad-CAM visual heatmaps for model transparency" },
            ].map(({ check, detail }) => (
              <div key={check} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{check}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Modules ────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">Platform Modules</h2>
          <p className="section-subtitle">8 integrated modules covering the full cyclone analysis pipeline</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map(({ icon: Icon, label, detail, href }) => (
            <Link key={label} href={href}
              className="card p-4 flex items-center gap-4 group hover:border-blue-300 dark:hover:border-blue-600/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{detail}</p>
              </div>
              <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors text-lg font-light flex-shrink-0">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────── */}
      <section className="card p-7 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Technology Stack</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { cat: "AI / ML",       items: ["PyTorch 2.1", "EfficientNet-B0", "ResNet50", "LSTM/GRU", "Grad-CAM"] },
            { cat: "Backend",       items: ["FastAPI", "SQLAlchemy 2.0", "SQLite/PostgreSQL", "Pydantic v2", "httpx"] },
            { cat: "Frontend",      items: ["Next.js 14", "TypeScript", "Tailwind CSS", "Recharts", "Lucide Icons"] },
            { cat: "Maps & GIS",    items: ["Leaflet.js", "React-Leaflet", "NASA GIBS WMTS", "Windy.com Embed"] },
            { cat: "Data Sources",  items: ["GDACS RSS", "IBTrACS CSV", "Open-Meteo API", "NASA GIBS API"] },
            { cat: "DevOps",        items: ["Docker Compose", "Render Deploy", "Vercel Frontend", "GitHub CI"] },
          ].map(({ cat, items }) => (
            <div key={cat} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">{cat}</p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Multi-Source Data Ingestion
          </h2>
          <p className="section-subtitle">Six distinct data sources — satisfying the "multi-source satellite data" requirement</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DATA_SOURCES.map(({ name, type, desc, href }) => (
            <div key={name} className="card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{name}</p>
                <span className={`badge text-[10px] border ${TYPE_COLORS[type]}`}>{type}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Official Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Links ───────────────────────────────────────────── */}
      <section className="card p-6 flex flex-wrap items-center gap-4">
        <a href="https://github.com/Prince-Nigam/Cyclone-AI" target="_blank" rel="noopener noreferrer"
          className="btn-outline">
          <Github className="w-4 h-4" />
          GitHub Repository
        </a>
        <Link href="/methodology" className="btn-outline">
          <BookOpen className="w-4 h-4" />
          ML Methodology
        </Link>
        <Link href="/performance" className="btn-outline">
          <BarChart3 className="w-4 h-4" />
          Model Performance
        </Link>
        <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer"
          className="btn-outline">
          <ExternalLink className="w-4 h-4" />
          IMD Official
        </a>
      </section>

    </div>
  );
}
