"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wind, Search, Map, Satellite, Clock,
  AlertTriangle, Loader2, ArrowRight, TrendingUp, Database,
  Activity, Globe2, Cpu, Layers, ShieldAlert, Radio, ExternalLink, RefreshCw,
} from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { LiveTickerBar } from "@/components/ui/LiveTickerBar";
import { getCyclones } from "@/services/cycloneService";
import { getRealtimeCyclones } from "@/services/realtimeService";
import type { Cyclone, IntensityClass, RealtimeCyclone } from "@/types";

/* ── Feature cards ─────────────────────────────────────────── */
const FEATURE_CARDS = [
  {
    icon: Search,
    title: "Cyclone Detection",
    desc: "EfficientNet-B0 binary detection from satellite IR imagery",
    href: "/detection",
    color: "blue",
    tag: "~85% acc.",
  },
  {
    icon: Wind,
    title: "Pattern Classification",
    desc: "ResNet50 intensity classification: TD / TS / CAT1-3+",
    href: "/satellite",
    color: "purple",
    tag: "5 classes",
  },
  {
    icon: TrendingUp,
    title: "Intensity Prediction",
    desc: "CNN+LSTM regression for wind speed and central pressure",
    href: "/prediction",
    color: "orange",
    tag: "MAE ≈ 8 kt",
  },
  {
    icon: Map,
    title: "Track Prediction",
    desc: "Seq2Seq LSTM 24h future cyclone path prediction",
    href: "/prediction",
    color: "red",
    tag: "24h horizon",
  },
  {
    icon: Satellite,
    title: "Satellite Viewer",
    desc: "Upload and analyze satellite images with Grad-CAM XAI",
    href: "/satellite",
    color: "cyan",
    tag: "Grad-CAM",
  },
  {
    icon: Clock,
    title: "Historical Analysis",
    desc: "Browse and explore IBTrACS historical cyclone records",
    href: "/historical",
    color: "slate",
    tag: "1978–2015",
  },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; tag: string }> = {
  blue:   { bg: "bg-blue-100   dark:bg-blue-500/15",   icon: "text-blue-600   dark:text-blue-400",   tag: "bg-blue-100   dark:bg-blue-500/20   text-blue-700   dark:text-blue-300"   },
  purple: { bg: "bg-purple-100 dark:bg-purple-500/15", icon: "text-purple-600 dark:text-purple-400", tag: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300" },
  orange: { bg: "bg-orange-100 dark:bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400", tag: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300" },
  red:    { bg: "bg-red-100    dark:bg-red-500/15",    icon: "text-red-600    dark:text-red-400",    tag: "bg-red-100    dark:bg-red-500/20    text-red-700    dark:text-red-300"    },
  cyan:   { bg: "bg-cyan-100   dark:bg-cyan-500/15",   icon: "text-cyan-600   dark:text-cyan-400",   tag: "bg-cyan-100   dark:bg-cyan-500/20   text-cyan-700   dark:text-cyan-300"   },
  slate:  { bg: "bg-slate-100  dark:bg-slate-500/15",  icon: "text-slate-600  dark:text-slate-400",  tag: "bg-slate-100  dark:bg-slate-500/20  text-slate-700  dark:text-slate-300"  },
};

const STAT_COLOR: Record<string, string> = {
  red:    "from-red-50    to-red-50/50    dark:from-red-500/15    dark:to-red-600/5    border-red-200    dark:border-red-500/30    text-red-600    dark:text-red-400",
  blue:   "from-blue-50   to-blue-50/50   dark:from-blue-500/15   dark:to-blue-600/5   border-blue-200   dark:border-blue-500/30   text-blue-600   dark:text-blue-400",
  green:  "from-green-50  to-green-50/50  dark:from-green-500/15  dark:to-green-600/5  border-green-200  dark:border-green-500/30  text-green-600  dark:text-green-400",
  purple: "from-purple-50 to-purple-50/50 dark:from-purple-500/15 dark:to-purple-600/5 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400",
};

/* ── Architecture items ─────────────────────────────────────── */
const ARCH = [
  { icon: "📡", label: "Data",     items: ["GDACS Live", "IBTrACS", "Open-Meteo", "NASA GIBS"] },
  { icon: "🧠", label: "AI Models",items: ["EfficientNet-B0", "ResNet50", "LSTM/GRU", "Grad-CAM"] },
  { icon: "⚡", label: "Backend",  items: ["FastAPI", "PostgreSQL/SQLite", "Real-Time Service"] },
  { icon: "🎨", label: "Frontend", items: ["Next.js 14", "Tailwind CSS", "Leaflet Maps"] },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"LIVE" | "HISTORICAL">("LIVE");

  // Historical Cyclones State
  const [recentCyclones, setRecentCyclones] = useState<Cyclone[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(true);

  // Live Real-Time Cyclones State
  const [liveCyclones, setLiveCyclones] = useState<RealtimeCyclone[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  const fetchLiveCyclones = () => {
    setLiveLoading(true);
    setLiveError(null);
    getRealtimeCyclones(false)
      .then((res) => setLiveCyclones(res.cyclones || []))
      .catch((err) => {
        setLiveError(err?.message || "Failed to fetch live cyclone alerts");
        setLiveCyclones([]);
      })
      .finally(() => setLiveLoading(false));
  };

  useEffect(() => {
    // 1. Fetch live active cyclones
    fetchLiveCyclones();

    // 2. Fetch historical cyclones
    getCyclones({ basin: "NI", limit: 5 })
      .then((res) => setRecentCyclones(res.cyclones))
      .catch(() => setRecentCyclones([]))
      .finally(() => setHistoricalLoading(false));

    // Auto-refresh every 5 minutes (300 seconds)
    const interval = setInterval(() => {
      fetchLiveCyclones();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getAlertBadgeClass = (alert: string) => {
    switch (alert?.toUpperCase()) {
      case "RED":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      case "ORANGE":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "GREEN":
      default:
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  const indianOceanLiveCount = liveCyclones.filter(c => c.basin === "NI" || c.basin === "SI").length;

  const STATS = [
    {
      icon: ShieldAlert,
      label: "Live Active Cyclones",
      value: liveLoading ? "..." : `${liveCyclones.length}`,
      sub: `${indianOceanLiveCount} in Indian Ocean`,
      color: "red"
    },
    {
      icon: Database,
      label: "IBTrACS Records",
      value: "3,000+",
      sub: "Historical cyclone archive",
      color: "blue"
    },
    {
      icon: Activity,
      label: "Model Accuracy",
      value: "~85%",
      sub: "Detection (EfficientNet)",
      color: "green"
    },
    {
      icon: Globe2,
      label: "Basin Focus",
      value: "NI / Global",
      sub: "North Indian + World",
      color: "purple"
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Real-Time 1s Telemetry Stream Bar ────────────── */}
      <LiveTickerBar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0f1e3d] to-slate-900 border border-slate-700/60 p-8 shadow-2xl animate-fade-in-up">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl" />
        {/* Subtle grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          <div className="w-16 h-16 flex-shrink-0 drop-shadow-2xl">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
              <circle cx="32" cy="32" r="30" fill="url(#heroGrad)" opacity="0.2"/>
              <circle cx="32" cy="32" r="28" fill="url(#heroGrad)"/>
              <circle cx="32" cy="32" r="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <circle cx="32" cy="32" r="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
              <path d="M32 10 C40 10 50 17 50 26 C50 33 44 38 36 40 C28 42 20 38 18 30" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.95"/>
              <path d="M32 54 C24 54 14 47 14 38 C14 31 20 26 28 24 C36 22 44 26 46 34" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <circle cx="32" cy="32" r="5" fill="white" opacity="0.95"/>
              <circle cx="32" cy="32" r="2.5" fill="url(#heroGrad)"/>
              <defs>
                <linearGradient id="heroGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60a5fa"/>
                  <stop offset="100%" stopColor="#1d4ed8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tropical Cyclone{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                AI Platform
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Real-Time Cyclone Tracking &amp; AI-Powered Forecast Hub</p>
          </div>
        </div>

        <p className="relative text-slate-300 text-sm max-w-2xl leading-relaxed mb-6">
          Multi-source satellite data fusion connecting real-time GDACS alerts, Open-Meteo marine telemetry, and NASA GIBS satellite feeds with EfficientNet, ResNet50, and LSTM neural forecasting.
        </p>

        <div className="relative flex flex-wrap gap-2 mb-6">
          <DataTypeBadge type="OBSERVED" />
          <DataTypeBadge type="HISTORICAL" />
          <DataTypeBadge type="PREDICTED" />
          <DataTypeBadge type="SIMULATED" />
        </div>

        <div className="relative flex flex-wrap gap-3">
          <Link href="/live-satellite" className="btn-primary">
            <Radio className="w-4 h-4 animate-pulse" /> Live Satellite &amp; Storms
          </Link>
          <Link href="/satellite" className="btn-secondary">
            AI Image Analysis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Stat cards ────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up animate-delay-100">
        {STATS.map(({ icon: Icon, label, value, sub, color }) => {
          const c = STAT_COLOR[color].split("  ");
          return (
            <div
              key={label}
              className={`stat-card bg-gradient-to-br border ${c[0]} ${c[1]} ${c[2]}`}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c[0]} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${c[3]}`} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{sub}</p>
            </div>
          );
        })}
      </section>

      {/* ── Active & Recent Cyclones Section ─────────────────── */}
      <section className="animate-fade-in-up animate-delay-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="section-title flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Tropical Cyclone Monitor
            </h2>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab("LIVE")}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg font-semibold transition-all ${
                  activeTab === "LIVE"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Storms (Live)
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  {liveCyclones.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("HISTORICAL")}
                className={`py-1 px-3 rounded-lg font-semibold transition-all ${
                  activeTab === "HISTORICAL"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Historical Archive
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "LIVE" ? (
              <>
                <button
                  onClick={fetchLiveCyclones}
                  disabled={liveLoading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? "animate-spin text-blue-500" : ""}`} />
                  Refresh
                </button>
                <Link
                  href="/live-satellite"
                  className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors font-medium"
                >
                  Full Real-Time Map <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <Link
                href="/historical"
                className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors font-medium"
              >
                Browse Full Catalog <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Tab Content: LIVE ACTIVE CYCLONES ── */}
        {activeTab === "LIVE" ? (
          liveLoading ? (
            <div className="glass-card rounded-2xl p-8 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm">Fetching active storm coordinates from GDACS...</span>
            </div>
          ) : liveError ? (
            <div className="glass-card rounded-2xl p-8 text-center border-red-500/30">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-red-400">{liveError}</p>
            </div>
          ) : liveCyclones.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Active Tropical Cyclones Detected</p>
              <p className="text-xs text-slate-400 mt-1">All ocean basins currently tranquil according to GDACS alert feeds.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                      {["Active Storm", "Basin", "Alert Level", "Intensity", "Wind Speed", "Location", "Source", "Action"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
                    {liveCyclones.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {c.name !== "UNNAMED" ? c.name : c.title.slice(0, 35)}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{c.title}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {c.basin}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getAlertBadgeClass(c.alert_level)}`}>
                            {c.alert_level}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <IntensityBadge intensity={c.intensity_class} />
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-800 dark:text-slate-200">
                          {c.wind_kt ? (
                            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                              <Wind className="w-3.5 h-3.5" />
                              {c.wind_kt} kt <span className="text-[10px] text-slate-400 font-normal">({c.wind_kmh} km/h)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {c.lat !== null && c.lon !== null ? (
                            `${c.lat.toFixed(1)}°, ${c.lon.toFixed(1)}°`
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <DataTypeBadge type="OBSERVED" />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href="/live-satellite"
                              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 font-semibold transition-all inline-flex items-center gap-1"
                            >
                              Live View →
                            </Link>
                            {c.url && (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-200 p-1"
                                title="Open GDACS alert report"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
        ) : (
          /* ── Tab Content: HISTORICAL ARCHIVE ── */
          historicalLoading ? (
            <div className="glass-card rounded-2xl p-8 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm">Loading historical cyclone archive...</span>
            </div>
          ) : recentCyclones.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-sm text-slate-400">No historical cyclone records found in database.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                      {["Name", "Year", "Basin", "Peak Intensity", "Peak Wind", "Type", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
                    {recentCyclones.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.name || "UNNAMED"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.season}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono font-bold">{c.basin}</td>
                        <td className="px-4 py-3">
                          <IntensityBadge intensity={(c.peak_intensity || "UNKNOWN") as IntensityClass} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 text-xs">
                          {c.peak_wind_kt ? `${c.peak_wind_kt} kt` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <DataTypeBadge type={c.data_type || "HISTORICAL"} />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/historical?id=${c.id}`}
                            className="text-xs text-blue-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all font-semibold"
                          >
                            Track View →
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

      {/* ── Platform Modules ──────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-300">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Platform AI Modules
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, href, color, tag }) => {
            const c = COLOR_MAP[color];
            return (
              <Link
                key={title}
                href={href}
                className="glass-card rounded-2xl p-5 group block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.tag}`}>
                    {tag}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                <div className={`flex items-center gap-1 mt-4 text-xs font-medium ${c.icon} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Open module <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Architecture ──────────────────────────────────── */}
      <section className="rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-white text-sm">System Architecture &amp; Data Pipeline</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-700/40">
          {ARCH.map(({ icon, label, items }) => (
            <div key={label} className="bg-slate-900/60 p-5 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">{label}</p>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <p key={item} className="text-xs text-slate-500 bg-slate-800/60 rounded-lg px-2 py-1">{item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
