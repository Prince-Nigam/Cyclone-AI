"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
