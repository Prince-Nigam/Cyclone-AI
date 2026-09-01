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
  OBSERVED:  { label: "● OBSERVED",  color: "text-green-700",  bg: "bg-green-50  border-green-200" },
  HISTORICAL:{ label: "◆ HISTORICAL",color: "text-blue-700",   bg: "bg-blue-50   border-blue-200"  },
  SIMULATED: { label: "◈ SIMULATED", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200"},
  PREDICTED: { label: "▶ PREDICTED", color: "text-orange-700", bg: "bg-orange-50 border-orange-200"},
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
