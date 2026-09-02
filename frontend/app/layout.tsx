import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ResearchBanner } from "@/components/ui/ResearchBanner";
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
          <ResearchBanner />

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
