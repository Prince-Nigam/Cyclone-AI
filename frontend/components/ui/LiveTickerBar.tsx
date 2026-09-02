"use client";

import React from "react";
import { Activity, Clock, Radio, RefreshCw, Sparkles, Wifi } from "lucide-react";
import { useLiveTelemetry } from "@/hooks/useLiveTelemetry";

export function LiveTickerBar() {
  const {
    currentTime,
    pulse,
    telemetry,
    isConnected,
    syncCountdown,
    liveLogs,
    refreshNow,
  } = useLiveTelemetry(3);

  const activeStorms = telemetry?.active_cyclones_count ?? 0;
  const topStorm = telemetry?.active_cyclones?.[0];

  return (
    <div className="w-full bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/60 rounded-2xl p-3 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Live status beacon */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`absolute w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-75 ${pulse ? "scale-150 animate-ping" : "scale-100"}`} />
            <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live 1s Telemetry Stream
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-semibold border border-blue-500/30">
              FRAME #{telemetry?.pulse_id ? telemetry.pulse_id % 10000 : "..."}
            </span>
          </div>
        </div>

        {/* Center: Live Second-by-Second Real-Time Clock */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400 font-sans text-[11px]">System Time:</span>
          <span className="font-bold text-white tracking-widest">{currentTime || "Syncing..."}</span>
        </div>

        {/* Right: Sync countdown & Quick stats */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Active Storms: <strong className="text-white font-mono">{activeStorms}</strong>
            </span>
            {topStorm && (
              <span className="text-slate-500">
                (Latest: <span className="text-amber-300 font-semibold">{topStorm.name}</span>)
              </span>
            )}
          </div>

          <button
            onClick={refreshNow}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-[11px] font-medium"
            title="Force immediate telemetry frame sync"
          >
            <RefreshCw className={`w-3 h-3 text-blue-400 ${syncCountdown === 1 ? "animate-spin" : ""}`} />
            <span>Sync: <span className="font-mono font-bold text-blue-400">{syncCountdown}s</span></span>
          </button>
        </div>
      </div>

      {/* Ticker bottom line: Rolling telemetry feed */}
      {liveLogs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] uppercase font-bold text-blue-400 px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">
              LOG STREAM
            </span>
            <span className="text-slate-300 truncate">{liveLogs[0]}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 flex-shrink-0 ml-2">
            <Wifi className="w-2.5 h-2.5" /> ONLINE
          </span>
        </div>
      )}
    </div>
  );
}
