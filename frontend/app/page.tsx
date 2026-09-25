"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Wind, Search, Map, Satellite, Clock,
  AlertTriangle, Loader2, ArrowRight, TrendingUp, Database,
  Activity, Globe2, Cpu, Layers, ShieldAlert, Radio,
  ExternalLink, RefreshCw, BookOpen, BarChart3, Zap, Eye,
  CheckCircle2, Info,
} from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { LiveTickerBar } from "@/components/ui/LiveTickerBar";
import { getCyclones } from "@/services/cycloneService";
import { getRealtimeCyclones } from "@/services/realtimeService";
import type { Cyclone, RealtimeCyclone } from "@/types";

/* ─────────────────────────────────────────────────────────────
   FEATURE CARDS
   ───────────────────────────────────────────────────────────── */
const FEATURE_CARDS = [
  {
    icon: Search,
    title: "Cyclone Detection",
    desc: "EfficientNet-B0 binary detection from satellite IR imagery with confidence scoring.",
    href: "/detection",
    accent: "blue",
    tag: "~85% Accuracy",
    tagColor: "blue",
  },
  {
    icon: Wind,
    title: "Pattern Classification",
    desc: "ResNet50 5-class intensity classification: TD / TS / CAT1 / CAT2 / CAT3+ (Saffir-Simpson).",
    href: "/satellite",
    accent: "purple",
    tag: "5 Classes",
    tagColor: "purple",
  },
  {
    icon: TrendingUp,
    title: "Intensity Prediction",
    desc: "CNN+LSTM regression for wind speed (kt) and central pressure (hPa) estimation.",
    href: "/prediction",
    accent: "amber",
    tag: "MAE ≈ 8 kt",
    tagColor: "amber",
  },
  {
    icon: Map,
    title: "Track Prediction",
    desc: "Seq2Seq LSTM 24-hour future cyclone path in 3-hour timesteps.",
    href: "/prediction",
    accent: "red",
    tag: "24h Horizon",
    tagColor: "red",
  },
  {
    icon: Eye,
    title: "Grad-CAM XAI",
    desc: "Explainable AI heatmaps showing where the model focuses — eye wall, spiral bands.",
    href: "/satellite",
    accent: "emerald",
    tag: "XAI",
    tagColor: "emerald",
  },
  {
    icon: Clock,
    title: "Historical Archive",
    desc: "Browse IBTrACS best-track records across all ocean basins from 1978 to 2015.",
    href: "/historical",
    accent: "slate",
    tag: "1978–2015",
    tagColor: "slate",
  },
];

const ACCENT_MAP: Record<string, { border: string; iconBg: string; icon: string; tag: string }> = {
  blue:    { border: "group-hover:border-blue-400/50",   iconBg: "bg-blue-100 dark:bg-blue-500/15",     icon: "text-blue-600 dark:text-blue-400",     tag: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  purple:  { border: "group-hover:border-purple-400/50", iconBg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400", tag: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  amber:   { border: "group-hover:border-amber-400/50",  iconBg: "bg-amber-100 dark:bg-amber-950/40",   icon: "text-amber-600 dark:text-amber-400",   tag: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" },
  red:     { border: "group-hover:border-red-400/50",    iconBg: "bg-red-100 dark:bg-red-950/40",       icon: "text-red-600 dark:text-red-400",       tag: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300" },
  emerald: { border: "group-hover:border-emerald-400/50",iconBg: "bg-emerald-100 dark:bg-emerald-950/30",icon:"text-emerald-600 dark:text-emerald-400",tag:"bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
  slate:   { border: "group-hover:border-slate-400/50",  iconBg: "bg-slate-100 dark:bg-slate-500/15",   icon: "text-slate-600 dark:text-slate-400",   tag: "bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300" },
};

/* ─────────────────────────────────────────────────────────────
   ARCHITECTURE PILLARS
   ───────────────────────────────────────────────────────────── */
const ARCH = [
  {
    icon: Database,
    label: "Data Ingestion",
    color: "blue",
    items: ["GDACS Live RSS", "IBTrACS Tracks", "Open-Meteo Marine", "NASA GIBS Tiles"],
  },
  {
    icon: Cpu,
    label: "AI Pipeline",
    color: "purple",
    items: ["EfficientNet-B0", "ResNet50", "CNN + LSTM", "Seq2Seq LSTM"],
  },
  {
    icon: Layers,
    label: "Backend",
    color: "amber",
    items: ["FastAPI", "SQLite / PostgreSQL", "Model Manager", "Real-Time Cache"],
  },
  {
    icon: Globe2,
    label: "Frontend",
    color: "emerald",
    items: ["Next.js 14", "Tailwind CSS", "Leaflet GIS", "Recharts"],
  },
];

const ARCH_COLOR: Record<string, string> = {
  blue:    "border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  purple:  "border-purple-200 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  amber:   "border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  emerald: "border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
};

/* ─────────────────────────────────────────────────────────────
   ALERT BADGE COLORS
   ───────────────────────────────────────────────────────────── */
function alertBadgeClass(alert: string) {
  switch (alert?.toUpperCase()) {
    case "RED":    return "bg-red-500/15 text-red-600 dark:text-red-300 border-red-400/40 font-bold";
    case "ORANGE": return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40 font-bold";
    default:       return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 font-bold";
  }
}

/* ═════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORICAL">("LIVE");

  const [recentCyclones, setRecentCyclones]         = useState<Cyclone[]>([]);
  const [historicalLoading, setHistoricalLoading]   = useState(true);

  const [liveCyclones, setLiveCyclones]             = useState<RealtimeCyclone[]>([]);
  const [liveLoading, setLiveLoading]               = useState(true);
  const [liveError, setLiveError]                   = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed]           = useState("");

  const fetchLiveCyclones = useCallback(() => {
    setLiveLoading(true);
    setLiveError(null);
    getRealtimeCyclones(false)
      .then((res) => {
        setLiveCyclones(res.cyclones || []);
        setLastRefreshed(new Date().toLocaleTimeString());
      })
      .catch((err) => {
        setLiveError(err?.message || "Failed to fetch live cyclone alerts");
        setLiveCyclones([]);
      })
      .finally(() => setLiveLoading(false));
  }, []);

  useEffect(() => {
    fetchLiveCyclones();
    getCyclones({ basin: "NI", limit: 6 })
      .then((res) => setRecentCyclones(res.cyclones))
      .catch(() => setRecentCyclones([]))
      .finally(() => setHistoricalLoading(false));

    const interval = setInterval(fetchLiveCyclones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveCyclones]);

  const indianOceanLiveCount = liveCyclones.filter(
    (c) => c.basin === "NI" || c.basin === "SI"
  ).length;

  const STATS = [
    {
      icon: ShieldAlert,
      label: "Active Cyclones",
      value: liveLoading ? "…" : `${liveCyclones.length}`,
      sub: `${indianOceanLiveCount} in Indian Ocean`,
      theme: "red",
    },
    {
      icon: Database,
      label: "IBTrACS Records",
      value: "3,000+",
      sub: "Historical cyclone archive",
      theme: "blue",
    },
    {
      icon: Activity,
      label: "Detection Accuracy",
      value: "~85%",
      sub: "EfficientNet-B0 on HURSAT-B1",
      theme: "green",
    },
    {
      icon: Globe2,
      label: "Basin Coverage",
      value: "NI + Global",
      sub: "Arabian Sea & Bay of Bengal",
      theme: "purple",
    },
  ];

  const STAT_THEME: Record<string, { border: string; iconBg: string; icon: string; grad: string }> = {
    red:    { border: "border-red-200 dark:border-red-700/40",       iconBg: "bg-red-100 dark:bg-red-900/30",       icon: "text-red-600 dark:text-red-400",       grad: "from-red-500/8 to-transparent" },
    blue:   { border: "border-blue-200 dark:border-blue-700/40",     iconBg: "bg-blue-100 dark:bg-blue-900/30",     icon: "text-blue-600 dark:text-blue-400",     grad: "from-blue-500/8 to-transparent" },
    green:  { border: "border-emerald-200 dark:border-emerald-700/40",iconBg: "bg-emerald-100 dark:bg-emerald-900/30",icon:"text-emerald-600 dark:text-emerald-400", grad: "from-emerald-500/8 to-transparent" },
    purple: { border: "border-purple-200 dark:border-purple-700/40", iconBg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400", grad: "from-purple-500/8 to-transparent" },
  };

  return (
    <div className="space-y-10 page-transition">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl bg-gradient-to-br from-[#06101e] via-[#0a1a35] to-[#07101d]">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(59,130,246,0.08),transparent)]" />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        <div className="relative px-6 sm:px-8 py-7 sm:py-9">
          {/* MoES tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-xs font-bold border border-blue-500/30 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Ministry of Earth Sciences · SIH 2024
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Active
            </span>
          </div>

          <div className="flex flex-col space-y-4">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Tropical Cyclone{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-300 to-cyan-300">
                AI Platform
              </span>
            </h1>

            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Multi-source satellite data fusion — real-time GDACS alerts, Open-Meteo marine
              telemetry and NASA GIBS imagery — combined with deep learning for identification,
              classification and 24-hour forecasting.
            </p>

            {/* Data provenance legend */}
            <div className="flex flex-wrap gap-2">
              <DataTypeBadge type="OBSERVED"   />
              <DataTypeBadge type="HISTORICAL" />
              <DataTypeBadge type="PREDICTED"  />
              <DataTypeBadge type="SIMULATED"  />
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link href="/live-satellite" className="btn-primary">
                <Radio className="w-4 h-4 text-emerald-300" />
                Live Storm Feed
              </Link>
              <Link href="/satellite" className="btn-secondary">
                AI Satellite Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/detection" className="btn-secondary">
                Cyclone Detection
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TELEMETRY TICKER ─────────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-50">
        <LiveTickerBar />
      </section>

      {/* ── STAT CARDS ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up animate-delay-100">
        {STATS.map(({ icon: Icon, label, value, sub, theme }) => {
          const t = STAT_THEME[theme];
          return (
            <div
              key={label}
              className={`stat-card border ${t.border} bg-gradient-to-br ${t.grad}`}
            >
              <div className={`w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center mb-3 flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${t.icon}`} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono leading-none">
                {value}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1.5">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
            </div>
          );
        })}
      </section>

      {/* ── FEATURE CARDS ────────────────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-150">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Platform Modules</h2>
            <p className="section-subtitle">End-to-end AI pipeline for cyclone analysis</p>
          </div>
          <Link href="/performance" className="btn-outline text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            View Benchmarks
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, href, accent, tag }) => {
            const ac = ACCENT_MAP[accent] || ACCENT_MAP.slate;
            return (
              <Link
                key={title}
                href={href}
                className={`feature-card border border-[var(--border-color)] ${ac.border} transition-all duration-200`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${ac.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${ac.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${ac.tag}`}>
                        {tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                  Open module <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── CYCLONE MONITOR ──────────────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Tropical Cyclone Monitor
            </h2>
            <p className="section-subtitle">Live GDACS alerts · IBTrACS historical archive</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab("LIVE")}
                className={`tab-pill flex items-center gap-1.5 ${activeTab === "LIVE" ? "tab-pill-active" : "tab-pill-inactive"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${liveCyclones.length > 0 ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
                Active Storms
                <span className={`text-[10px] px-1.5 rounded-full font-bold ${activeTab === "LIVE" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                  {liveCyclones.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("HISTORICAL")}
                className={`tab-pill ${activeTab === "HISTORICAL" ? "tab-pill-active" : "tab-pill-inactive"}`}
              >
                Historical
              </button>
            </div>

            {activeTab === "LIVE" ? (
              <>
                <button
                  onClick={fetchLiveCyclones}
                  disabled={liveLoading}
                  className="btn-outline text-xs py-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? "animate-spin text-blue-500" : ""}`} />
                  Refresh
                </button>
                <Link href="/live-satellite" className="btn-outline text-xs py-1.5">
                  Full Map <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <Link href="/historical" className="btn-outline text-xs py-1.5">
                Full Catalog <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Last refreshed */}
        {lastRefreshed && activeTab === "LIVE" && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Last synced: {lastRefreshed} · Auto-refresh every 5 min
          </p>
        )}

        {/* ── LIVE TAB ── */}
        {activeTab === "LIVE" && (
          liveLoading ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Fetching active storm data from GDACS…</p>
              <p className="text-xs text-slate-400">This may take a moment</p>
            </div>
          ) : liveError ? (
            <div className="card p-10 text-center border-red-200 dark:border-red-800/40">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">GDACS Feed Unavailable</p>
              <p className="text-xs text-slate-500 mt-1">{liveError}</p>
              <button onClick={fetchLiveCyclones} className="btn-outline mt-4 mx-auto text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : liveCyclones.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Activity className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Tropical Cyclones</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                All ocean basins currently tranquil according to GDACS alert feeds.
              </p>
              <DataTypeBadge type="OBSERVED" className="mt-4" />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                <table className="data-table">
                  <thead>
                    <tr>
                      {["Active Storm", "Basin", "Alert", "Category", "Wind Speed", "Location", "Type", "Action"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveCyclones.map((c) => (
                      <tr key={c.id}>
                        {/* Name */}
                        <td>
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                            <div className="max-w-[190px]">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {c.name !== "UNNAMED" ? c.name : c.title.slice(0, 28)}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{c.title}</p>
                            </div>
                          </div>
                        </td>
                        {/* Basin */}
                        <td>
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {c.basin}
                          </span>
                        </td>
                        {/* Alert */}
                        <td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alertBadgeClass(c.alert_level)}`}>
                            {c.alert_level}
                          </span>
                        </td>
                        {/* Intensity */}
                        <td><IntensityBadge intensity={c.intensity_class} /></td>
                        {/* Wind */}
                        <td className="whitespace-nowrap">
                          {c.wind_kt ? (
                            <span className={`flex items-center gap-1 font-mono text-xs font-semibold ${c.wind_kt >= 34 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              <Wind className="w-3 h-3" />
                              {c.wind_kt} kt
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({c.wind_kmh ? Math.round(c.wind_kmh) : Math.round(c.wind_kt * 1.852)} km/h)
                              </span>
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        {/* Location */}
                        <td className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {c.lat != null && c.lon != null
                            ? `${c.lat.toFixed(1)}°, ${c.lon.toFixed(1)}°`
                            : "—"}
                        </td>
                        {/* Type */}
                        <td><DataTypeBadge type="OBSERVED" /></td>
                        {/* Actions */}
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Link href="/live-satellite"
                              className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 font-semibold transition-all">
                              Live →
                            </Link>
                            {c.url && (
                              <a href={c.url} target="_blank" rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors" title="Open GDACS report">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* ── HISTORICAL TAB ── */}
        {activeTab === "HISTORICAL" && (
          historicalLoading ? (
            <div className="card p-12 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm">Loading IBTrACS archive…</span>
            </div>
          ) : recentCyclones.length === 0 ? (
            <div className="card p-12 text-center">
              <Database className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Historical Archive Empty</p>
              <p className="text-xs text-slate-400 mt-1">Run the database seeder to load IBTrACS cyclone records.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                <table className="data-table">
                  <thead>
                    <tr>
                      {["Name", "Year", "Basin", "Peak Category", "Peak Wind", "Type", ""].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCyclones.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{c.name || "UNNAMED"}</td>
                        <td className="font-mono text-xs text-slate-500">{c.season || "—"}</td>
                        <td>
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {c.basin || "—"}
                          </span>
                        </td>
                        <td>{c.peak_intensity ? <IntensityBadge intensity={c.peak_intensity} /> : "—"}</td>
                        <td className="font-mono text-xs whitespace-nowrap">
                          {c.peak_wind_kt ? (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Wind className="w-3 h-3 text-slate-400" />
                              {c.peak_wind_kt} kt
                            </span>
                          ) : "—"}
                        </td>
                        <td><DataTypeBadge type="HISTORICAL" /></td>
                        <td>
                          <Link href={`/historical`}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 font-semibold transition-all">
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </section>

      {/* ── ARCHITECTURE ────────────────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-300">
        <div className="mb-5">
          <h2 className="section-title">System Architecture</h2>
          <p className="section-subtitle">Multi-source data ingestion → AI inference → Real-time visualization</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCH.map(({ icon: Icon, label, color, items }, idx) => (
            <div key={label} className={`card p-5 border ${ARCH_COLOR[color]}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ARCH_COLOR[color]}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Step {idx + 1}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ARCH_COLOR[color].includes("blue") ? "bg-blue-400" : ARCH_COLOR[color].includes("purple") ? "bg-purple-400" : ARCH_COLOR[color].includes("amber") ? "bg-amber-400" : "bg-emerald-400"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Flow arrow (hidden on mobile) */}
        <div className="hidden lg:flex items-center justify-center gap-2 mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Raw Satellite Data</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">AI Preprocessing</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Model Inference</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 font-semibold">Prediction + XAI Output</span>
        </div>
      </section>

    </div>
  );
}
