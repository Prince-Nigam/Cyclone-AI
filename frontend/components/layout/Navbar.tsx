"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Wind, Menu, X, Zap } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20"
          : "bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60"
      )}
    >
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Wind className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-base tracking-tight">Cyclone</span>
              <span className="text-blue-400 font-bold text-base tracking-tight ml-1">AI</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
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
                    "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 block",
                    pathname === link.href
                      ? "text-white bg-blue-500/20 ring-1 ring-blue-500/40"
                      : link.highlight
                      ? "text-emerald-400 hover:text-white hover:bg-emerald-500/15 ring-1 ring-emerald-500/30 animate-pulse-ring"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/6"
                  )}
                >
                  {pathname === link.href && (
                    <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                  )}
                  {link.label}
                </Link>

                {/* Hover tooltip */}
                {hoveredHref === link.href && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 z-50 p-3.5 pointer-events-none">
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-l border-t border-slate-700/80 rotate-45" />
                    <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                      <span>{link.icon}</span>
                      {link.label}
                    </p>
                    <ul className="space-y-1">
                      {link.info.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
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

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Research</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/8 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-500/30"
                  : link.highlight
                  ? "text-emerald-400 hover:text-white hover:bg-emerald-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/6"
              )}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
              <div className="mt-1 space-y-0.5 pl-5">
                {link.info.slice(0, 2).map((item, i) => (
                  <p key={i} className="text-xs text-slate-500">▸ {item}</p>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
