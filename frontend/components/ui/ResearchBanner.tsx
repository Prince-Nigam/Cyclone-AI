"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export function ResearchBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative z-20 bg-amber-500/10 dark:bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 truncate">
          <span className="flex-shrink-0 flex items-center justify-center p-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
            SIH Prototype
          </span>
          <span className="text-[11px] truncate">
            Research prototype for Smart India Hackathon. All AI predictions are model outputs. For official alerts visit <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-500">IMD</a>.
          </span>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-0.5 rounded-md hover:bg-amber-500/20 transition-all flex-shrink-0"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
