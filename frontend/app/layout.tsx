import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cyclone AI Platform — SIH",
  description:
    "AI/ML based Tropical Cyclone Identification, Classification and Prediction System. Smart India Hackathon research prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <Navbar />

          {/* Research Disclaimer Banner */}
          <div className="relative z-10 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-400 backdrop-blur-sm">
            ⚠️ <strong>Research Prototype</strong> — Smart India Hackathon Project.
            Not an official weather forecasting system. All predictions are model outputs only.
          </div>

          <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
                borderRadius: "12px",
                fontSize: "13px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
