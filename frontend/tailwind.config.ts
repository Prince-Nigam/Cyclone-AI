import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
        cyclone: {
          td:       "#22c55e",  // green — Tropical Depression
          ts:       "#eab308",  // yellow — Tropical Storm
          cat1:     "#f97316",  // orange — Category 1
          cat2:     "#ef4444",  // red — Category 2
          cat3plus: "#9333ea",  // purple — Category 3+
        },
        data: {
          observed:  "#22c55e",  // green
          historical:"#3b82f6",  // blue
          simulated: "#eab308",  // yellow
          predicted: "#f97316",  // orange
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
