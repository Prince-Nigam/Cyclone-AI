"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export function ResearchBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative z-20 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 dark:from-red-950/40 dark:via-slate-900/60 dark:to-emerald-950/40 border-b border-amber-500/30 px-4 py-1.5 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 truncate">
          <span className="flex-shrink-0 flex items-center justify-center p-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
            SIH Prototype
          </span>
          <span className="text-[11px] truncate">
            Research prototype for Smart India Hackathon. All AI predictions are model outputs. For official emergency alerts visit{" "}
            <a
              href="https://mausam.imd.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30"
            >
              IMD Official Portal ↗
            </a>
          </span>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 p-0.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all flex-shrink-0"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
