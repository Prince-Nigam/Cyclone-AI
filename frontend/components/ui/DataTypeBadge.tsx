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
  OBSERVED:  { label: "● OBSERVED",  color: "text-sky-600 dark:text-sky-300",       bg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800" },
  HISTORICAL:{ label: "◆ HISTORICAL",color: "text-blue-600 dark:text-blue-300",     bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" },
  SIMULATED: { label: "◈ SIMULATED", color: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700" },
  PREDICTED: { label: "▶ PREDICTED", color: "text-blue-700 dark:text-blue-200",     bg: "bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-600" },
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
