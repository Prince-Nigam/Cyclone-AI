"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Satellite, Upload, X, ArrowRight, Loader2 } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { analyzeImage } from "@/services/cycloneService";
import type { AnalysisResult } from "@/types";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";

const SUPPORTED_FORMATS = ".png,.jpg,.jpeg,.tif,.tiff,.nc,.h5,.hdf5";
const MAX_SIZE_MB = 50;

export default function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
    const previewable = ["image/png","image/jpeg","image/tiff","image/gif"];
    if (previewable.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeImage(selectedFile, undefined, undefined, true);
      setResult(res);
      toast.success("Analysis complete");
    } catch (err: any) {
      const msg = err.message || "Analysis failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Cyclone Detection & Classification
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload a satellite image — AI pipeline runs detection, classification, and Grad-CAM explainability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Satellite className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedFile ? selectedFile.name : "Drop satellite image here"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5) · Max {MAX_SIZE_MB}MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          {preview && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={preview} alt="Preview" className="w-full object-contain max-h-64 bg-black" />
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedFile && !preview && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Upload className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => { setSelectedFile(null); setResult(null); }} className="ml-auto text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Satellite className="w-4 h-4" /> Run AI Analysis</>
            )}
          </button>

          {/* Model info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Detection", arch: "EfficientNet-B0", details: ["Binary: cyclone / no cyclone", "Confidence score", "224×224 IR input"] },
              { title: "Classification", arch: "ResNet50", details: ["5 classes: TD/TS/CAT1-3+", "Per-class probability", "Saffir-Simpson scale"] },
            ].map(({ title, arch, details }) => (
              <div key={title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</p>
                <p className="text-xs text-blue-600 font-mono mb-2">{arch}</p>
                <ul className="space-y-0.5">
                  {details.map((d) => (
                    <li key={d} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1">
                      <span className="text-blue-400">▸</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Analysis Results</h2>
          <AnalysisPanel result={result} isLoading={isAnalyzing} error={error} />
        </div>
      </div>
    </div>
  );
}
