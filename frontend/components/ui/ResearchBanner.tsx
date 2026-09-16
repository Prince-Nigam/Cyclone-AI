"use client";

import React, { useState } from "react";
import { AlertCircle, X } from "lucide-react";

export function ResearchBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative z-20 bg-blue-500/10 dark:bg-blue-950/40 border-b border-blue-500/20 px-4 py-1.5 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 truncate">
          <span className="flex-shrink-0 flex items-center justify-center p-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300">
            SIH Prototype
          </span>
          <span className="text-[11px] truncate">
            Research prototype for Smart India Hackathon. All AI predictions are model outputs. For official alerts visit <a href="https://mausam.imd.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-400">IMD</a>.
          </span>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-0.5 rounded-md hover:bg-blue-500/20 transition-all flex-shrink-0"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
