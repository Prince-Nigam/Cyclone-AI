import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cyclone AI Platform — SIH 2024 | MoES",
    template: "%s | Cyclone AI — SIH",
  },
  description:
    "AI/ML based Tropical Cyclone Identification, Classification and Prediction System. " +
    "Built for Smart India Hackathon 2024 — Ministry of Earth Sciences (MoES) problem statement. " +
    "Features EfficientNet detection, ResNet50 classification, LSTM track forecasting & Grad-CAM XAI.",
  keywords: [
    "cyclone detection", "tropical cyclone AI", "SIH 2024", "MoES", "GDACS",
    "satellite imagery", "machine learning", "deep learning", "weather prediction",
    "Indian Ocean", "IBTrACS", "Smart India Hackathon",
  ],
  authors: [{ name: "SIH Team — MoES Problem Statement" }],
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#060d1b" },
    { media: "(prefers-color-scheme: light)", color: "#f0f4f8" },
  ],
  openGraph: {
    title: "Cyclone AI Platform — SIH 2024",
    description: "Real-time AI cyclone tracking & forecasting for Ministry of Earth Sciences.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          {/* Sticky top navbar */}
          <Navbar />

          {/* Main content */}
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 page-content">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            gutter={10}
            toastOptions={{
              duration: 4000,
              style: {
                background:   "var(--bg-card)",
                color:        "var(--fg-primary)",
                border:       "1px solid var(--border-color)",
                borderRadius: "12px",
                fontSize:     "13px",
                fontFamily:   "Inter, system-ui, sans-serif",
                boxShadow:    "var(--shadow-lg)",
                maxWidth:     "360px",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "white" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "white" },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
