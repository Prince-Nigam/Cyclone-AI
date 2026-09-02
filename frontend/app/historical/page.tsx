"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { IntensityBadge } from "@/components/ui/IntensityBadge";
import { getCyclones, getCyclone } from "@/services/cycloneService";
import type { Cyclone, IntensityClass } from "@/types";

const CycloneMap = dynamic(
  () => import("@/components/map/CycloneMap").then((m) => m.CycloneMap),
  { ssr: false, loading: () => <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

const BASINS = [
  { value: "", label: "All Basins" },
  { value: "NI", label: "North Indian Ocean (NI)" },
  { value: "WP", label: "West Pacific (WP)" },
  { value: "EP", label: "East Pacific (EP)" },
  { value: "NA", label: "North Atlantic (NA)" },
];

export default function HistoricalPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <HistoricalContent />
    </Suspense>
  );
}

function HistoricalContent() {
  const searchParams = useSearchParams();
  const [cyclones, setCyclones] = useState<Cyclone[]>([]);
  const [selected, setSelected] = useState<Cyclone | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({ basin: "NI", name: "", year: "" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Load cyclones
  useEffect(() => {
    setLoading(true);
    getCyclones({
      basin: filters.basin || undefined,
      name: filters.name || undefined,
      year: filters.year ? parseInt(filters.year) : undefined,
      page,
      limit: 15,
    })
      .then((res) => { setCyclones(res.cyclones); setTotal(res.total); })
      .catch(() => setCyclones([]))
      .finally(() => setLoading(false));
  }, [filters, page]);

  // Load from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) loadDetail(id);
  }, [searchParams]);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await getCyclone(id);
      setSelected(detail);
    } catch {
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Historical Cyclone Explorer</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Browse archived cyclone records from IBTrACS dataset.
          All records are labeled as <DataTypeBadge type="HISTORICAL" className="inline-flex" />.
        </p>
      </div>

      {/* Info stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🗃️</span>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">IBTrACS Dataset</p>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">~3,000+ global cyclones</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">1978–2015 · 6-hourly observations</p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🌏</span>
          <div>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide">NI Basin Focus</p>
            <p className="text-sm font-bold text-green-900 dark:text-green-200">Arabian Sea + Bay of Bengal</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Filter by basin · name · year</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Filters + List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filters</h2>

            <select
              value={filters.basin}
              onChange={(e) => { setFilters({ ...filters, basin: e.target.value }); setPage(1); }}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              {BASINS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search name..."
                value={filters.name}
                onChange={(e) => { setFilters({ ...filters, name: e.target.value }); setPage(1); }}
                className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }}
                className="w-24 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Cyclone list */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : cyclones.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-500" />
                No cyclones found
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
                {cyclones.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadDetail(c.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                      ${selected?.id === c.id ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{c.name || "UNNAMED"}</span>
                      <IntensityBadge intensity={(c.peak_intensity || "UNKNOWN") as IntensityClass} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {c.basin} · {c.season} ·{" "}
                      {c.peak_wind_kt ? `${c.peak_wind_kt} kt` : "N/A"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 15 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <span>{total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Prev</button>
                  <span>p.{page}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-600 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail + Map */}
        <div className="lg:col-span-2 space-y-4">
          {detailLoading ? (
            <div className="flex items-center gap-2 p-8 justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading cyclone details...</span>
            </div>
          ) : selected ? (
            <>
              {/* Header */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Cyclone {selected.name || "UNNAMED"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selected.basin} · {selected.season} · {selected.num_observations} observations
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IntensityBadge intensity={(selected.peak_intensity || "UNKNOWN") as IntensityClass} />
                    <DataTypeBadge type={selected.data_type || "HISTORICAL"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: "Peak Wind", value: selected.peak_wind_kt ? `${selected.peak_wind_kt} kt` : "—" },
                    { label: "Min Pressure", value: selected.min_pressure_hpa ? `${selected.min_pressure_hpa} hPa` : "—" },
                    { label: "Start", value: selected.start_time ? new Date(selected.start_time).toLocaleDateString() : "—" },
                    { label: "End",   value: selected.end_time   ? new Date(selected.end_time).toLocaleDateString()   : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-mono">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              {selected.track && selected.track.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Historical Track</h3>
                  <CycloneMap
                    historicalTrack={selected.track}
                    height="380px"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Search className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">Select a cyclone from the list to view details and track</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
