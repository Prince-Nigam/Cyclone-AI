"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, Satellite, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { analyzeImage } from "@/services/cycloneService";
import type { AnalysisResult } from "@/types";

const SUPPORTED_FORMATS = ".png,.jpg,.jpeg,.tif,.tiff,.nc,.h5,.hdf5";
const MAX_SIZE_MB = 50;

export default function SatellitePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["png","jpg","jpeg","tif","tiff","nc","h5","hdf5"];
    if (!allowed.includes(ext)) {
      toast.error(`Unsupported format: .${ext}`);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_SIZE_MB}MB)`);
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);

    if (["png","jpg","jpeg","tif","tiff"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Satellite Image Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload a satellite image to run AI cyclone detection, classification, and Grad-CAM explainability.
        </p>
      </div>

      {/* Info stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">AI Pipeline</p>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">EfficientNet-B0 + ResNet50</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Detection → Classification → Grad-CAM XAI</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📁</span>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">Supported Formats</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">PNG · JPG · TIFF · NetCDF · HDF5</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Max 50 MB · 224×224 IR input preferred</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Upload + image */}
        <div className="space-y-4">

          {/* Drop zone */}
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
              Supported: PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5) · Max {MAX_SIZE_MB}MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={preview} alt="Satellite preview" className="w-full object-contain max-h-64 bg-black" />
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Preview
              </div>
            </div>
          )}

          {/* No-preview format note */}
          {selectedFile && !preview && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              {selectedFile.name} — Preview unavailable for this format.
              Analysis will still run on the raw data.
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
              text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {selectedFile ? "Run AI Analysis" : "Select an Image First"}
              </>
            )}
          </button>

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
            <strong>Pipeline:</strong> Image → Detection → Classification → Grad-CAM XAI
            <br />
            <strong>Models:</strong> EfficientNet-B0 (detection), ResNet50 (classification)
            <br />
            <strong>Data type:</strong> All outputs labeled as PREDICTED or SIMULATED
          </div>
        </div>

        {/* Right: Results */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Analysis Results</h2>
          <AnalysisPanel result={result} isLoading={isAnalyzing} error={error} />
        </div>
      </div>
    </div>
  );
}
