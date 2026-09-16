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
          td:       "#93c5fd", // light blue
          ts:       "#60a5fa", // sky blue
          cat1:     "#3b82f6", // royal blue
          cat2:     "#2563eb", // dark blue
          cat3plus: "#1d4ed8", // deep navy blue
        },
        data: {
          observed:  "#38bdf8",
          historical:"#3b82f6",
          simulated: "#60a5fa",
          predicted: "#1d4ed8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a3a 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
        "blue-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.18), transparent)",
      },
      boxShadow: {
        "card":       "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(59,130,246,0.10)",
        "glow-blue":  "0 0 20px rgba(59,130,246,0.35)",
        "glow-sm":    "0 0 10px rgba(59,130,246,0.20)",
        "inner-sm":   "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in-up": "fade-in-up 0.45s ease both",
        "pulse-ring":  "pulse-ring 2s ease infinite",
        "shimmer":     "shimmer 2.5s linear infinite",
      },
      keyframes: {
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%":   { boxShadow: "0 0 0 0 rgba(59,130,246,0.4)" },
          "70%":  { boxShadow: "0 0 0 8px rgba(59,130,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [],
};

export default config;
