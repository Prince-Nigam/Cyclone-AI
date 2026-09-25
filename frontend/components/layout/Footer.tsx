import React from "react";
import Link from "next/link";
import {
  Wind, Github, ExternalLink, AlertTriangle,
  Map, Satellite, BarChart3, BookOpen, History,
} from "lucide-react";

const QUICK_LINKS = [
  { href: "/detection",    label: "Cyclone Detection" },
  { href: "/satellite",    label: "AI Satellite Analysis" },
  { href: "/prediction",   label: "Track & Intensity" },
  { href: "/live-satellite", label: "Live Storm Feed" },
  { href: "/map",          label: "Interactive Map" },
  { href: "/historical",   label: "Historical Archive" },
  { href: "/performance",  label: "Model Performance" },
  { href: "/methodology",  label: "ML Methodology" },
];

const DATA_SOURCES = [
  { label: "GDACS — Global Disaster Alert", href: "https://www.gdacs.org" },
  { label: "IBTrACS — Best Track Archive", href: "https://www.ncei.noaa.gov/products/international-best-track-archive" },
  { label: "Open-Meteo Marine API", href: "https://open-meteo.com" },
  { label: "NASA GIBS Satellite Tiles", href: "https://gibs.earthdata.nasa.gov" },
  { label: "IMD — India Met Department", href: "https://mausam.imd.gov.in" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-[var(--border-color)] bg-white dark:bg-[#07101d]">
      {/* Top accent */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand column ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-600/30 flex-shrink-0">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Cyclone AI Platform</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">SIH 2024</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              AI/ML-based tropical cyclone identification, classification and prediction
              system built for Smart India Hackathon.
            </p>

            {/* MoES badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl px-3 py-2.5">
              <div className="w-1.5 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Ministry of Earth Sciences</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Government of India</p>
              </div>
            </div>

            {/* GitHub */}
            <a
              href="https://github.com/Prince-Nigam/Cyclone-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* ── Quick links ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Platform Modules
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 transition-colors flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Data sources ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Data Sources
            </h3>
            <ul className="space-y-2.5">
              {DATA_SOURCES.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── AI Models ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              AI Models
            </h3>
            <div className="space-y-2.5">
              {[
                { name: "EfficientNet-B0",   task: "Binary Detection",          acc: "85.4%" },
                { name: "ResNet50",           task: "5-Class Classification",    acc: "76.8%" },
                { name: "CNN + LSTM",         task: "Intensity Regression",      acc: "MAE 8 kt" },
                { name: "Seq2Seq LSTM",       task: "24h Track Forecast",        acc: "MAE 48 km" },
                { name: "Grad-CAM",           task: "Explainability (XAI)",      acc: "Visual" },
              ].map(({ name, task, acc }) => (
                <div key={name} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{task}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                    {acc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom strip ── */}
        <div className="mt-10 pt-6 border-t border-[var(--border-color)]">
          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Research Prototype Disclaimer:</strong> This platform is developed as an AI/ML research prototype for Smart India Hackathon 2024.
              It is <strong>NOT</strong> an official operational meteorological warning service.
              For official storm advisories and emergency alerts in India, always consult the{" "}
              <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer"
                className="underline hover:text-amber-600 dark:hover:text-amber-200">
                India Meteorological Department (IMD)
              </a>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
            <p>© {year} Cyclone AI Platform — Smart India Hackathon · Ministry of Earth Sciences</p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">About</Link>
              <Link href="/methodology" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Methodology</Link>
              <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
                IMD <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
