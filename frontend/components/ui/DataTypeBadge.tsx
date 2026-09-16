/**
 * DataTypeBadge
 * ==============
 * Clearly labels data as: OBSERVED / HISTORICAL / SIMULATED / PREDICTED
 * Scientific integrity: never show predictions as real observations.
 */

import React from "react";
import { clsx } from "clsx";
import type { DataType } from "@/types";

const CONFIG: Record<DataType, { label: string; color: string; bg: string }> = {
  OBSERVED:  { label: "● OBSERVED",  color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60 shadow-sm shadow-emerald-500/10" },
  HISTORICAL:{ label: "◆ HISTORICAL",color: "text-slate-700 dark:text-slate-300",       bg: "bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700/60" },
  SIMULATED: { label: "◈ SIMULATED", color: "text-amber-700 dark:text-amber-300",     bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60" },
  PREDICTED: { label: "▶ PREDICTED", color: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700/60 shadow-sm shadow-red-500/10" },
};

interface Props {
  type: DataType;
  className?: string;
  size?: "sm" | "md";
}

export function DataTypeBadge({ type, className, size = "sm" }: Props) {
  const cfg = CONFIG[type] || CONFIG.SIMULATED;
  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold border rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        cfg.color, cfg.bg,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
