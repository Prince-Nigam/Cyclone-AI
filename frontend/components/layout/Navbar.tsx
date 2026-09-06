"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu, X, Zap } from "lucide-react";
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
          ? "bg-[#050c1a] border-b border-slate-700/70 shadow-xl shadow-black/40"
          : "bg-[#070e1c] border-b border-slate-700/50"
      )}
    >
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            {/* Earth Projection + Cyclone Vortex Logo */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)] group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(56,189,248,0.7)] transition-all duration-300"
              >
                <defs>
                  {/* Globe radial gradient with oceanic illumination */}
                  <radialGradient id="earthSphere" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="45%" stopColor="#0f2452" />
                    <stop offset="85%" stopColor="#08142c" />
                    <stop offset="100%" stopColor="#030712" />
                  </radialGradient>

                  {/* Atmosphere rim glow */}
                  <linearGradient id="atmosGlow" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Cyclone outer spiral gradient */}
                  <linearGradient id="cycloneArm1" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.9" />
                    <stop offset="80%" stopColor="#0284c7" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Cyclone inner feeder band gradient */}
                  <linearGradient id="cycloneArm2" x1="32" y1="32" x2="10" y2="10" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Eye thermal core */}
                  <radialGradient id="eyeCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.2" />
                  </radialGradient>

                  <clipPath id="globeClip">
                    <circle cx="20" cy="20" r="16.5" />
                  </clipPath>
                </defs>

                {/* Outer atmospheric aura */}
                <circle cx="20" cy="20" r="18.5" stroke="url(#atmosGlow)" strokeWidth="1" opacity="0.4" strokeDasharray="3 2" />
                <circle cx="20" cy="20" r="17.2" stroke="url(#atmosGlow)" strokeWidth="0.75" opacity="0.8" />

                {/* Earth Sphere Base */}
                <circle cx="20" cy="20" r="16.5" fill="url(#earthSphere)" />

                {/* Clipped Earth Projection grid & landmass */}
                <g clipPath="url(#globeClip)">
                  {/* Subtle stylized continent / landmass contours */}
                  <path
                    d="M13 11 C15 13 19 12 21 14 C23 16 22 19 19 22 C17 24 18 27 16 29 C14 26 12 22 11 18 Z"
                    fill="rgba(52, 211, 153, 0.18)"
                    stroke="rgba(52, 211, 153, 0.35)"
                    strokeWidth="0.6"
                  />
                  <path
                    d="M24 10 C27 11 31 15 30 19 C28 21 26 20 25 18 C24 15 25 12 24 10 Z"
                    fill="rgba(52, 211, 153, 0.14)"
                    stroke="rgba(52, 211, 153, 0.25)"
                    strokeWidth="0.5"
                  />

                  {/* Latitude / Parallels */}
                  <ellipse cx="20" cy="20" rx="16.5" ry="5.5" stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
                  <ellipse cx="20" cy="13" rx="14.5" ry="4" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.22" fill="none" />
                  <ellipse cx="20" cy="27" rx="14.5" ry="4" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.22" fill="none" />

                  {/* Longitude / Meridians */}
                  <ellipse cx="20" cy="20" rx="7.5" ry="16.5" stroke="#38bdf8" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
                  <ellipse cx="20" cy="20" rx="13" ry="16.5" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
                  <line x1="20" y1="3.5" x2="20" y2="36.5" stroke="#38bdf8" strokeWidth="0.75" strokeOpacity="0.35" strokeDasharray="2 2" />

                  {/* Globe specular illumination arc (top-left) */}
                  <path
                    d="M6 14 A16.5 16.5 0 0 1 20 3.5"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>

                {/* Cyclone System overlaid across Projection */}
                {/* Main Outer Inflow Spiral Arm */}
                <path
                  d="M23 7 C31 8 36 14 34 22 C32 28 26 33 19 32 C12 31 7 25 8 18 C9 13 14 10 18 11 C22 12 25 15 24 19 C23 22 20 24 18 23"
                  stroke="url(#cycloneArm1)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Secondary Inflow Rainband */}
                <path
                  d="M12 27 C7 23 6 15 11 10 C16 5 25 6 30 11 C34 16 32 23 27 26 C23 28 18 26 17 22 C16 19 18 16.5 21 17"
                  stroke="url(#cycloneArm2)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Cyclone Core Eye (Thermal + Central Eye) */}
                <circle cx="20" cy="19.5" r="3.2" fill="url(#eyeCore)" />
                <circle cx="20" cy="19.5" r="1.5" fill="#020617" stroke="#38bdf8" strokeWidth="0.6" />
                <circle cx="20" cy="19.5" r="0.6" fill="#ffffff" />

                {/* Orbit Satellite indicator dot */}
                <circle cx="33.5" cy="11.5" r="1.3" fill="#38bdf8" className="animate-pulse" />
                <circle cx="33.5" cy="11.5" r="2.8" stroke="#38bdf8" strokeWidth="0.5" opacity="0.6" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-white font-extrabold text-sm tracking-tight">CYCLONE</span>
              <span className="text-blue-400 font-bold text-xs tracking-widest">AI PLATFORM</span>
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
                    "relative px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 block",
                    pathname === link.href
                      ? "text-white bg-blue-500/25 ring-1 ring-blue-400/50"
                      : link.highlight
                      ? "text-emerald-300 hover:text-white hover:bg-emerald-500/15 ring-1 ring-emerald-400/40"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
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
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
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
                "block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                pathname === link.href
                  ? "bg-blue-500/25 text-white ring-1 ring-blue-400/50"
                  : link.highlight
                  ? "text-emerald-300 hover:text-white hover:bg-emerald-500/10"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
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
