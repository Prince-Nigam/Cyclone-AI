import React from "react";
import { clsx } from "clsx";
import { INTENSITY_COLORS, INTENSITY_LABELS, type IntensityClass } from "@/types";

interface Props {
  intensity: IntensityClass;
  className?: string;
}

export function IntensityBadge({ intensity, className }: Props) {
  const color = INTENSITY_COLORS[intensity] || "#6b7280";
  return (
    <span
      className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white", className)}
      style={{ backgroundColor: color }}
    >
      {INTENSITY_LABELS[intensity] || intensity}
    </span>
  );
}
