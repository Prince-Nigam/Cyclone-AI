import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cyclone AI Platform — SIH",
  description:
    "AI/ML based Tropical Cyclone Identification, Classification and Prediction System. Smart India Hackathon research prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Navbar />

        {/* Research Disclaimer Banner */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-1.5 text-center text-xs text-yellow-800">
          ⚠️ <strong>Research Prototype</strong> — Smart India Hackathon Project.
          Not an official weather forecasting system. All predictions are model outputs only.
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
