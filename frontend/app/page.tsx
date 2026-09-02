"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wind, Search, Map, BarChart3, Satellite, Clock,
  AlertTriangle, Loader2, ArrowRight, TrendingUp, Database,
  Activity, Globe2, Cpu, Layers,
} from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { getCyclones } from "@/services/cycloneService";
import type { Cyclone, IntensityClass } from "@/types";

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

const COLOR_MAP: Record<string, { bg: string; icon: string; tag: string; border: string }> = {
  blue:   { bg: "bg-blue-500/10",   icon: "text-blue-400",   tag: "bg-blue-500/15 text-blue-300",   border: "border-blue-500/20" },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-400", tag: "bg-purple-500/15 text-purple-300", border: "border-purple-500/20" },
  orange: { bg: "bg-orange-500/10", icon: "text-orange-400", tag: "bg-orange-500/15 text-orange-300", border: "border-orange-500/20" },
  red:    { bg: "bg-red-500/10",    icon: "text-red-400",    tag: "bg-red-500/15 text-red-300",    border: "border-red-500/20" },
  cyan:   { bg: "bg-cyan-500/10",   icon: "text-cyan-400",   tag: "bg-cyan-500/15 text-cyan-300",   border: "border-cyan-500/20" },
  slate:  { bg: "bg-slate-500/10",  icon: "text-slate-400",  tag: "bg-slate-500/15 text-slate-300", border: "border-slate-500/20" },
};

/* ── Stat cards ─────────────────────────────────────────────── */
const STATS = [
  { icon: Database, label: "IBTrACS Records",  value: "3,000+",  sub: "Global cyclones",         color: "blue"   },
  { icon: Activity, label: "Model Accuracy",   value: "~85%",    sub: "Detection (EfficientNet)", color: "green"  },
  { icon: Globe2,   label: "Basin Focus",      value: "NI",      sub: "North Indian Ocean",       color: "purple" },
  { icon: Cpu,      label: "AI Models",        value: "4",       sub: "Detection · Class · LSTM", color: "orange" },
];

const STAT_COLOR: Record<string, string> = {
  blue:   "from-blue-500/20 to-blue-600/5   border-blue-500/25  text-blue-400",
  green:  "from-green-500/20 to-green-600/5  border-green-500/25 text-green-400",
  purple: "from-purple-500/20 to-purple-600/5 border-purple-500/25 text-purple-400",
  orange: "from-orange-500/20 to-orange-600/5 border-orange-500/25 text-orange-400",
};

/* ── Architecture items ─────────────────────────────────────── */
const ARCH = [
  { icon: "📡", label: "Data",     items: ["IBTrACS", "HURSAT-B1", "INSAT-3D"] },
  { icon: "🧠", label: "AI Models",items: ["EfficientNet-B0", "ResNet50", "LSTM/GRU"] },
  { icon: "⚡", label: "Backend",  items: ["FastAPI", "PostgreSQL", "SQLAlchemy"] },
  { icon: "🎨", label: "Frontend", items: ["Next.js 14", "Tailwind CSS", "Leaflet"] },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [recentCyclones, setRecentCyclones] = useState<Cyclone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCyclones({ basin: "NI", limit: 5 })
      .then((res) => setRecentCyclones(res.cyclones))
      .catch(() => setRecentCyclones([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0f1e3d] to-slate-900 border border-slate-700/60 p-8 shadow-2xl animate-fade-in-up">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl" />
        {/* Subtle grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/40 flex-shrink-0">
            <Wind className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tropical Cyclone{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                AI Platform
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Smart India Hackathon — AI/ML Research Prototype</p>
          </div>
        </div>

        <p className="relative text-slate-300 text-sm max-w-2xl leading-relaxed mb-6">
          Multi-source satellite data fusion for cyclone identification, pattern classification,
          intensity prediction and track forecasting using EfficientNet, ResNet50 and LSTM models.
        </p>

        <div className="relative flex flex-wrap gap-2 mb-6">
          <DataTypeBadge type="HISTORICAL" />
          <DataTypeBadge type="PREDICTED" />
          <DataTypeBadge type="SIMULATED" />
          <DataTypeBadge type="OBSERVED" />
        </div>

        <div className="relative flex flex-wrap gap-3">
          <Link href="/satellite" className="btn-primary">
            Start Analysis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/historical" className="btn-secondary">
            View Historical
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
              <p className="text-2xl font-extrabold text-slate-100 tracking-tight">{value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
            </div>
          );
        })}
      </section>

      {/* ── Platform Modules ──────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Platform Modules
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

      {/* ── Recent Cyclones ───────────────────────────────── */}
      <section className="animate-fade-in-up animate-delay-300">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Recent Indian Ocean Cyclones
          </h2>
          <Link
            href="/historical"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 p-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading cyclone records…</span>
          </div>
        ) : recentCyclones.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm text-slate-400">No cyclone records found. Check database connection.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                  {["Name", "Year", "Basin", "Peak", "Wind", "Type", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30">
                {recentCyclones.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-500/4 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.name || "UNNAMED"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.season}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.basin}</td>
                    <td className="px-4 py-3">
                      <IntensityBadge intensity={(c.peak_intensity || "UNKNOWN") as IntensityClass} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 text-xs">
                      {c.peak_wind_kt ? `${c.peak_wind_kt} kt` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DataTypeBadge type={c.data_type || "HISTORICAL"} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/historical?id=${c.id}`}
                        className="text-xs text-blue-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Architecture ──────────────────────────────────── */}
      <section className="rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-white text-sm">System Architecture</h2>
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
