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
}

const NAV_LINKS: NavLink[] = [
  { href: "/",                label: "Dashboard" },
  { href: "/detection",       label: "Detection" },
  { href: "/prediction",      label: "Prediction" },
  { href: "/map",             label: "Map" },
  { href: "/live-satellite",  label: "Live", highlight: true },
  { href: "/satellite",       label: "Satellite" },
  { href: "/historical",      label: "Historical" },
  { href: "/performance",     label: "Performance" },
  { href: "/methodology",     label: "Methodology" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-slate-900 dark:bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
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
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-slate-700 text-white"
                    : link.highlight
                    ? "text-green-300 hover:text-white hover:bg-slate-700 ring-1 ring-green-500/50"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                {link.label}
              </Link>
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
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
