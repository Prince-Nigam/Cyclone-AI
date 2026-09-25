"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Menu, X, LayoutDashboard, Scan, TrendingUp,
  Map as MapIcon, Radio, History, BarChart3, BookOpen, Info,
  ChevronDown, Wind, Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    Icon: LayoutDashboard,
    description: "Platform overview & live storm monitor",
  },
  {
    href: "/detection",
    label: "Detection",
    Icon: Scan,
    description: "EfficientNet-B0 binary cyclone detection",
  },
  {
    href: "/satellite",
    label: "AI Analysis",
    Icon: Wind,
    description: "Satellite image analysis with Grad-CAM XAI",
  },
  {
    href: "/prediction",
    label: "Prediction",
    Icon: TrendingUp,
    description: "24h track & intensity forecasting",
  },
  {
    href: "/live-satellite",
    label: "Live",
    Icon: Radio,
    badge: "LIVE",
    badgeColor: "emerald",
    description: "Real-time GDACS cyclones & ocean grid",
  },
  {
    href: "/map",
    label: "Map",
    Icon: MapIcon,
    description: "Interactive GIS cyclone track map",
  },
  {
    href: "/historical",
    label: "Historical",
    Icon: History,
    description: "IBTrACS archive 1978–2015",
  },
  {
    href: "/performance",
    label: "Performance",
    Icon: BarChart3,
    description: "Model benchmarks & confusion matrix",
  },
];

const MORE_ITEMS: NavItem[] = [
  {
    href: "/methodology",
    label: "Methodology",
    Icon: BookOpen,
    description: "ML pipeline & architecture details",
  },
  {
    href: "/about",
    label: "About",
    Icon: Info,
    description: "Project info, team & MoES alignment",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[var(--bg-nav)] border-b border-[var(--border-color)] shadow-md shadow-black/10 dark:shadow-black/40 backdrop-blur-xl"
          : "bg-[var(--bg-nav)] border-b border-[var(--border-color)]"
      )}
    >
      {/* ── Top accent line ── */}
      <div className="h-[2px] bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-80" />

      {/* ── MoES banner strip ── */}
      <div className="hidden sm:flex items-center justify-center gap-2 bg-blue-700 dark:bg-blue-900/80 py-1 px-4 text-[11px] text-blue-100 font-medium tracking-wide">
        <span className="opacity-80">Ministry of Earth Sciences (MoES) · Smart India Hackathon 2024</span>
        <span className="opacity-40 mx-1">|</span>
        <span className="opacity-80">⚠️ Research Prototype — Not an official IMD forecast system</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            {/* Cyclone SVG logo */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover:drop-shadow-[0_0_14px_rgba(59,130,246,0.8)] transition-all duration-300">
                <defs>
                  <radialGradient id="nb-earth" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="60%" stopColor="#0f2452" />
                    <stop offset="100%" stopColor="#030712" />
                  </radialGradient>
                  <linearGradient id="nb-atmos" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="nb-arm1" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#7dd3fc" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="nb-arm2" x1="32" y1="32" x2="10" y2="10" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                  </linearGradient>
                  <radialGradient id="nb-eye" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" />
                  </radialGradient>
                  <clipPath id="nb-clip"><circle cx="20" cy="20" r="16.5" /></clipPath>
                </defs>
                <circle cx="20" cy="20" r="18" stroke="url(#nb-atmos)" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
                <circle cx="20" cy="20" r="16.8" stroke="url(#nb-atmos)" strokeWidth="0.7" opacity="0.9" />
                <circle cx="20" cy="20" r="16.5" fill="url(#nb-earth)" />
                <g clipPath="url(#nb-clip)">
                  <path d="M13 11 C15 13 19 12 21 14 C23 16 22 19 19 22 C17 24 18 27 16 29 C14 26 12 22 11 18 Z"
                    fill="rgba(52,211,153,0.18)" stroke="rgba(52,211,153,0.35)" strokeWidth="0.6" />
                  <ellipse cx="20" cy="20" rx="16.5" ry="5.5" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />
                  <ellipse cx="20" cy="20" rx="7.5" ry="16.5" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />
                  <line x1="20" y1="3.5" x2="20" y2="36.5" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="2 2" />
                </g>
                <path d="M23 7 C31 8 36 14 34 22 C32 28 26 33 19 32 C12 31 7 25 8 18 C9 13 14 10 18 11 C22 12 25 15 24 19 C23 22 20 24 18 23"
                  stroke="url(#nb-arm1)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M12 27 C7 23 6 15 11 10 C16 5 25 6 30 11 C34 16 32 23 27 26 C23 28 18 26 17 22 C16 19 18 16.5 21 17"
                  stroke="url(#nb-arm2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="20" cy="19.5" r="3.2" fill="url(#nb-eye)" />
                <circle cx="20" cy="19.5" r="1.5" fill="#020617" stroke="#38bdf8" strokeWidth="0.6" />
                <circle cx="20" cy="19.5" r="0.6" fill="#ffffff" />
                <circle cx="33" cy="11" r="1.3" fill="#38bdf8">
                  <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-slate-900 dark:text-white font-extrabold text-sm tracking-tight">
                CYCLONE AI
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-[10px] tracking-widest uppercase">
                SIH Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const LinkIcon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.description}
                  className={clsx(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : item.badge === "LIVE"
                      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  )}
                >
                  <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={clsx(
                      "flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    )}>
                      <span className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        active ? "bg-white animate-pulse" : "bg-emerald-500 animate-pulse"
                      )} />
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                  MORE_ITEMS.some(i => isActive(i.href))
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                )}
              >
                More
                <ChevronDown className={clsx("w-3 h-3 transition-transform duration-200", moreOpen ? "rotate-180" : "")} />
              </button>

              {moreOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-black/15 dark:shadow-black/50 z-50 overflow-hidden animate-fade-in">
                  {MORE_ITEMS.map((item) => {
                    const ItemIcon = item.Icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-start gap-3 px-4 py-3 transition-colors",
                          active
                            ? "bg-blue-50 dark:bg-blue-900/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          active ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        )}>
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={clsx("text-sm font-semibold", active ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* ── Right side controls ── */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Live status pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Live</span>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* All nav items */}
            {[...NAV_ITEMS, ...MORE_ITEMS].map((item) => {
              const active = isActive(item.href);
              const LinkIcon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : item.badge === "LIVE"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <LinkIcon className={clsx("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* MoES info strip */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Ministry of Earth Sciences · Smart India Hackathon 2024
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
