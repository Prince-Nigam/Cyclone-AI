"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wind, Search, Map, BarChart3, Satellite, Clock,
  AlertTriangle, CheckCircle, Loader2, ArrowRight,
} from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { getCyclones } from "@/services/cycloneService";
import type { Cyclone, IntensityClass } from "@/types";

const FEATURE_CARDS = [
  { icon: Search,    title: "Cyclone Detection",       desc: "EfficientNet-B0 binary detection from satellite IR imagery", href: "/detection",   color: "blue"   },
  { icon: Wind,      title: "Pattern Classification",  desc: "ResNet50 intensity classification: TD / TS / CAT1-3+",        href: "/detection",   color: "purple" },
  { icon: BarChart3, title: "Intensity Prediction",    desc: "CNN+LSTM regression for wind speed and central pressure",     href: "/prediction",  color: "orange" },
  { icon: Map,       title: "Track Prediction",        desc: "Seq2Seq LSTM 24h future cyclone path prediction",            href: "/prediction",  color: "red"    },
  { icon: Satellite, title: "Satellite Viewer",        desc: "Upload and analyze satellite images with Grad-CAM XAI",      href: "/satellite",   color: "green"  },
  { icon: Clock,     title: "Historical Analysis",     desc: "Browse and explore IBTrACS historical cyclone records",      href: "/historical",  color: "slate"  },
];

const COLOR_MAP: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  green:  "bg-green-50 text-green-700 border-green-200",
  slate:  "bg-slate-50 text-slate-700 border-slate-200",
};

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
    <div className="space-y-8">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <Wind className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tropical Cyclone AI Platform</h1>
            <p className="text-slate-400 text-sm">Smart India Hackathon — AI/ML Research Prototype</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          Multi-source satellite data fusion for cyclone identification, pattern classification,
          intensity prediction and track forecasting using EfficientNet, ResNet50 and LSTM models.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <DataTypeBadge type="HISTORICAL" />
          <DataTypeBadge type="PREDICTED" />
          <DataTypeBadge type="SIMULATED" />
          <DataTypeBadge type="OBSERVED" />
        </div>
        <div className="flex gap-3 mt-5">
          <Link href="/satellite" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
            Start Analysis <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/historical" className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            View Historical
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, href, color }) => (
            <Link
              key={title}
              href={href}
              className={`p-4 rounded-xl border bg-white hover:shadow-md transition-all group`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${COLOR_MAP[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 group-hover:text-blue-700">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Cyclones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Indian Ocean Cyclones</h2>
          <Link href="/historical" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 p-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading cyclone records...</span>
          </div>
        ) : recentCyclones.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No cyclone records found. Check database connection.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Year</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Basin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Peak</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Wind</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCyclones.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name || "UNNAMED"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.season}</td>
                    <td className="px-4 py-3 text-slate-600">{c.basin}</td>
                    <td className="px-4 py-3">
                      <IntensityBadge intensity={(c.peak_intensity || "UNKNOWN") as IntensityClass} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {c.peak_wind_kt ? `${c.peak_wind_kt} kt` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DataTypeBadge type={c.data_type || "HISTORICAL"} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/historical?id=${c.id}`} className="text-xs text-blue-600 hover:text-blue-700">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Architecture overview */}
      <div className="bg-slate-800 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">System Architecture</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          {[
            { label: "Data", items: ["IBTrACS", "HURSAT-B1", "INSAT-3D"] },
            { label: "AI Models", items: ["EfficientNet-B0", "ResNet50", "LSTM/GRU"] },
            { label: "Backend", items: ["FastAPI", "PostgreSQL", "SQLAlchemy"] },
            { label: "Frontend", items: ["Next.js 14", "Tailwind CSS", "Leaflet"] },
          ].map(({ label, items }) => (
            <div key={label} className="bg-slate-700 rounded-xl p-3">
              <p className="font-semibold text-slate-300 mb-2">{label}</p>
              {items.map((item) => (
                <p key={item} className="text-slate-400">{item}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
