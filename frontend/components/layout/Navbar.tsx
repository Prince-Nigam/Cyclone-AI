"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Wind, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavLink {
  href: string;
  label: string;
  highlight?: boolean;
  icon: string;
  info: string[];
}

const NAV_LINKS: NavLink[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "🏠",
    info: [
      "Platform overview & live stats",
      "Recent Indian Ocean cyclones",
      "Quick access to all modules",
      "System architecture summary",
    ],
  },
  {
    href: "/detection",
    label: "Detection",
    icon: "🔍",
    info: [
      "EfficientNet-B0 binary classifier",
      "Upload satellite IR image",
      "Confidence score output",
      "Grad-CAM explainability heatmap",
    ],
  },
  {
    href: "/prediction",
    label: "Prediction",
    icon: "📈",
    info: [
      "CNN+LSTM intensity regression",
      "Wind speed & pressure forecast",
      "Seq2Seq track prediction (24h)",
      "Load from historical cyclones",
    ],
  },
  {
    href: "/map",
    label: "Map",
    icon: "🗺️",
    info: [
      "Interactive Leaflet map",
      "Historical + predicted tracks",
      "NASA GIBS satellite layer",
      "NI basin cyclone selector",
    ],
  },
  {
    href: "/live-satellite",
    label: "Live",
    icon: "🛰️",
    highlight: true,
    info: [
      "Real-time Windy.com weather",
      "NASA GIBS MODIS/VIIRS tiles",
      "Wind, rain, temp overlays",
      "Arabian Sea & Bay of Bengal",
    ],
  },
  {
    href: "/satellite",
    label: "Satellite",
    icon: "🌍",
    info: [
      "Upload PNG / TIFF / NetCDF",
      "Full AI analysis pipeline",
      "ResNet50 pattern classification",
      "Grad-CAM XAI visualization",
    ],
  },
  {
    href: "/historical",
    label: "Historical",
    icon: "📂",
    info: [
      "IBTrACS dataset (1978–2015)",
      "Filter by basin, name, year",
      "Peak wind & pressure stats",
      "Track visualization on map",
    ],
  },
  {
    href: "/performance",
    label: "Performance",
    icon: "📊",
    info: [
      "Model accuracy & F1 scores",
      "Per-class precision & recall",
      "Registered model registry",
      "Test set evaluation metrics",
    ],
  },
  {
    href: "/methodology",
    label: "Methodology",
    icon: "📖",
    info: [
      "Detection & classification pipeline",
      "LSTM track & intensity models",
      "Multi-source data fusion strategy",
      "Temporal train/val/test split",
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              Cyclone AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setHoveredHref(link.href)}
                onMouseLeave={() => setHoveredHref(null)}
              >
                <Link
                  href={link.href}
                  className={clsx(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors block",
                    pathname === link.href
                      ? "bg-slate-700 text-white"
                      : link.highlight
                      ? "text-green-300 hover:text-white hover:bg-slate-700 ring-1 ring-green-500/50"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  )}
                >
                  {link.label}
                </Link>

                {/* Hover tooltip */}
                {hoveredHref === link.href && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 p-3 pointer-events-none">
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-l border-t border-slate-600 rotate-45" />

                    <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                      <span>{link.icon}</span>
                      {link.label}
                    </p>
                    <ul className="space-y-1">
                      {link.info.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer badge + Theme toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs bg-yellow-900/50 text-yellow-300 border border-yellow-700 px-2 py-1 rounded-full">
              ⚠️ Research Prototype
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-300 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-2 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "block px-3 py-2 rounded-md text-sm font-medium",
                pathname === link.href
                  ? "bg-slate-700 text-white"
                  : link.highlight
                  ? "text-green-300 hover:text-white hover:bg-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              )}
            >
              <span className="mr-1.5">{link.icon}</span>
              {link.label}
              <div className="mt-1 space-y-0.5 pl-4">
                {link.info.slice(0, 2).map((item, i) => (
                  <p key={i} className="text-xs text-slate-400">▸ {item}</p>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
