"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export function ResearchBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative z-20 bg-slate-900/90 dark:bg-[#060c18] border-b border-slate-800 px-4 py-1.5 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 truncate">
          <span className="flex-shrink-0 flex items-center justify-center p-0.5 rounded-full bg-amber-500/15 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            SIH Prototype
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            Research prototype for Smart India Hackathon. All predictions are AI model outputs. For official alerts visit{" "}
            <a
              href="https://mausam.imd.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-semibold hover:underline"
            >
              IMD Portal ↗
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
