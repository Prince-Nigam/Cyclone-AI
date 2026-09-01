import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">About This Project</h1>
        <p className="text-slate-500 text-sm mt-1">Smart India Hackathon — AI/ML Tropical Cyclone Platform</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Problem Statement</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          "To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system
          for identification, classification, and prediction of different tropical cyclone
          patterns using multi-source satellite data."
        </p>

        <h2 className="font-bold text-slate-800">Our Approach</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          We built a modular, end-to-end platform that processes satellite imagery from
          multiple sources (HURSAT-B1, INSAT-3D) and applies deep learning models for
          cyclone detection, intensity classification, and track/intensity prediction,
          with explainable AI visualization through Grad-CAM.
        </p>

        <h2 className="font-bold text-slate-800">⚠️ Important Disclaimer</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          This is a <strong>research prototype</strong> for the Smart India Hackathon.
          It is NOT an official weather forecasting or warning system.
          All predictions are clearly labeled as model outputs.
          Do not use for emergency decision-making.
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { label: "Detection Model", value: "EfficientNet-B0" },
            { label: "Classification", value: "ResNet50" },
            { label: "Track Prediction", value: "Seq2Seq LSTM" },
            { label: "Intensity Pred.", value: "CNN + LSTM" },
            { label: "Fusion", value: "Feature-level" },
            { label: "XAI", value: "Grad-CAM" },
            { label: "Backend", value: "FastAPI" },
            { label: "Frontend", value: "Next.js 14" },
            { label: "Data Source", value: "IBTrACS + HURSAT-B1" },
            { label: "Database", value: "PostgreSQL" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm py-1 border-b border-slate-50">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-700 font-mono">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/methodology" className="text-sm text-blue-600 hover:text-blue-700 underline">
            ML Methodology →
          </Link>
          <Link href="/performance" className="text-sm text-blue-600 hover:text-blue-700 underline">
            Model Performance →
          </Link>
        </div>
      </div>
    </div>
  );
}
