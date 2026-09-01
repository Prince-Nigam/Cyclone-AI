"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Satellite } from "lucide-react";

export default function DetectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cyclone Detection & Classification</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload satellite images for AI-powered detection and intensity classification.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Satellite className="w-12 h-12 mx-auto text-blue-500 mb-4" />
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Use the Satellite Viewer for Analysis
        </h2>
        <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">
          The Satellite Image Viewer runs the complete pipeline: detection, classification,
          and Grad-CAM explainability in one unified interface.
        </p>
        <Link
          href="/satellite"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Open Satellite Viewer <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "Detection Model",
            arch: "EfficientNet-B0",
            details: ["Binary: cyclone / no cyclone", "Confidence score output", "ImageNet pretrained + fine-tuned", "Input: 224×224 IR image"],
          },
          {
            title: "Classification Model",
            arch: "ResNet50",
            details: ["5 classes: TD / TS / CAT1 / CAT2 / CAT3+", "Saffir-Simpson scale labels", "Per-class probability output", "Transfer learning from ImageNet"],
          },
        ].map(({ title, arch, details }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
            <p className="text-xs text-blue-600 font-mono mb-3">{arch}</p>
            <ul className="space-y-1">
              {details.map((d, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-blue-400">▸</span>{d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
