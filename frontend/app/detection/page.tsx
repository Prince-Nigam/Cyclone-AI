"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
    const previewable = ["image/png", "image/jpeg", "image/tiff", "image/gif", "image/webp"];
    if (previewable.includes(file.type) || /\.(png|jpe?g|tiff?|webp)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            toast.success("Image pasted from clipboard");
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileSelect]);

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
        {/* Upload Box */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              // Reset input value so re-selecting same file works
              e.target.value = "";
            }}
          />

          {!selectedFile ? (
            /* Empty Dropzone */
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all min-h-[240px] flex flex-col items-center justify-center
                ${dragOver
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-4 ring-blue-500/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400 shadow-sm">
                <Satellite className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to choose or drag & drop image
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5) · Max {MAX_SIZE_MB}MB
              </p>
              <span className="mt-3 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full font-medium">
                Ctrl+V / Paste supported
              </span>
            </div>
          ) : preview ? (
            /* Selected Image Preview directly inside the box */
            <div
              className={`relative rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 bg-slate-950 shadow-inner group transition-all
                ${dragOver ? "border-blue-500 ring-4 ring-blue-500/10" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {/* Image */}
              <div className="flex items-center justify-center min-h-[240px] max-h-[320px] p-2 bg-slate-950/80">
                <img
                  src={preview}
                  alt={selectedFile.name}
                  className="max-h-[290px] w-full object-contain rounded-lg"
                />
              </div>

              {/* Top Bar with file details and action buttons */}
              <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
                  <Satellite className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[160px] sm:max-w-[220px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono flex-shrink-0">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs bg-black/60 hover:bg-white/20 text-white border border-white/15 px-2.5 py-1 rounded-lg backdrop-blur-md font-medium transition-colors flex items-center gap-1"
                    title="Change Photo"
                  >
                    <Upload className="w-3 h-3" />
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreview(null);
                      setResult(null);
                      setError(null);
                    }}
                    className="bg-black/60 hover:bg-red-600/80 text-white border border-white/15 p-1 rounded-lg backdrop-blur-md transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Non-Image file (NetCDF / HDF5) */
            <div
              className={`rounded-xl p-5 border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 transition-all
                ${dragOver ? "border-blue-500 ring-4 ring-blue-500/10" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Scientific Data File
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setResult(null);
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Satellite className="w-4 h-4" /> {selectedFile ? "Run AI Analysis" : "Select an Image to Analyze"}</>
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
