"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Satellite, Upload, X, Loader2, Sparkles, Info } from "lucide-react";
import { DataTypeBadge } from "@/components/ui/DataTypeBadge";
import { analyzeImage } from "@/services/cycloneService";
import { validateImageFileForCyclone } from "@/lib/cycloneDetector";
import type { AnalysisResult } from "@/types";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";

const SUPPORTED_FORMATS = ".png,.jpg,.jpeg,.tif,.tiff,.nc,.h5,.hdf5";
const MAX_SIZE_MB = 50;

/* ── Sample cyclone images for demo ── */
const SAMPLE_IMAGES = [
  {
    label: "Typhoon (CAT3+)",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Typhoon_Megi_%282016%29_Oct_26.jpg/640px-Typhoon_Megi_%282016%29_Oct_26.jpg",
    hint: "Super Typhoon Megi 2016 — MODIS visible satellite",
  },
  {
    label: "Hurricane Eye Wall",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Hurricane_Isabel_from_ISS.jpg/640px-Hurricane_Isabel_from_ISS.jpg",
    hint: "Hurricane Isabel — ISS photograph",
  },
  {
    label: "Cyclone Spiral Bands",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Cyclone_Gafilo.jpg/640px-Cyclone_Gafilo.jpg",
    hint: "Cyclone Gafilo — MODIS Terra",
  },
];

export default function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview]           = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [result, setResult]             = useState<AnalysisResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 1. handleFileSelect — MUST come before loadSampleImage ── */
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

  /* ── 2. loadSampleImage — uses handleFileSelect ── */
  const loadSampleImage = useCallback(async (url: string, label: string) => {
    setLoadingSample(true);
    setResult(null);
    setError(null);
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const ext  = url.split(".").pop()?.split("?")[0] || "jpg";
      const file = new File(
        [blob],
        `sample-${label.replace(/\s+/g, "-").toLowerCase()}.${ext}`,
        { type: blob.type || "image/jpeg" }
      );
      handleFileSelect(file);
      toast.success(`Sample loaded: ${label}`);
    } catch {
      toast.error("Could not load sample image. Check your internet connection.");
    } finally {
      setLoadingSample(false);
    }
  }, [handleFileSelect]);

  /* ── Clipboard paste support ── */
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  /* ── Run AI analysis ── */
  const runAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const validation = await validateImageFileForCyclone(selectedFile);
    if (!validation.isCyclone) {
      setError(`No cyclone detected — ${validation.reason || "Image does not match a tropical cyclone satellite structure."}`);
      toast.error("No cyclone detected in this image.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await analyzeImage(selectedFile, undefined, undefined, true);
      if (!res || !res.detection || res.detection.detected === false) {
        const disclaimer = res?.detection?.disclaimer
          || "No cyclone detected. Please upload a satellite IR image of an active tropical cyclone.";
        setError(disclaimer);
        toast.error("No cyclone detected in this image.");
        return;
      }
      setResult(res);
      toast.success("Cyclone detected — analysis complete!");
    } catch (err: any) {
      const msg = err.message || "Analysis failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 page-transition">

      {/* ── Page hero ── */}
      <div className="page-hero">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-blue text-[11px]">EfficientNet-B0</span>
            <span className="badge badge-purple text-[11px]">ResNet50</span>
            <span className="badge badge-green text-[11px]">Grad-CAM XAI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cyclone Detection &amp; Classification
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Upload a satellite IR image — the AI pipeline runs detection, intensity
            classification, and Grad-CAM explainability in one pass.
          </p>
        </div>
      </div>

      {/* ── Sample images strip ── */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Try with a sample cyclone image</p>
          <span className="ml-auto badge badge-amber text-[10px]">Demo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.label}
              onClick={() => loadSampleImage(sample.url, sample.label)}
              disabled={loadingSample || isAnalyzing}
              title={sample.hint}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {loadingSample ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />
              ) : (
                <Satellite className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              )}
              {sample.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          Public domain satellite imagery. For real analysis, use HURSAT-B1 or INSAT IR images.
        </p>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload panel */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = "";
            }}
          />

          {!selectedFile ? (
            /* Empty dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all min-h-[240px] flex flex-col items-center justify-center ${
                dragOver
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-4 ring-blue-500/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400 shadow-sm">
                <Satellite className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to choose or drag &amp; drop image
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                PNG, JPG, TIFF, NetCDF (.nc), HDF5 (.h5) · Max {MAX_SIZE_MB}MB
              </p>
              <span className="mt-3 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full font-medium">
                Ctrl+V / Paste supported
              </span>
            </div>

          ) : preview ? (
            /* Image preview box */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl overflow-hidden border-2 bg-slate-950 shadow-inner transition-all ${
                dragOver ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-700"
              }`}
            >
              <div className="flex items-center justify-center min-h-[240px] max-h-[320px] p-2 bg-slate-950/80">
                <img
                  src={preview}
                  alt={selectedFile.name}
                  className="max-h-[290px] w-full object-contain rounded-lg"
                />
              </div>
              {/* Overlay bar */}
              <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
                  <Satellite className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[160px] sm:max-w-[220px]" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono flex-shrink-0">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="text-xs bg-black/60 hover:bg-white/20 text-white border border-white/15 px-2.5 py-1 rounded-lg backdrop-blur-md font-medium transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Change
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreview(null); setResult(null); setError(null); }}
                    className="bg-black/60 hover:bg-red-600/80 text-white border border-white/15 p-1 rounded-lg backdrop-blur-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          ) : (
            /* Non-image file (NetCDF / HDF5) */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-xl p-5 border-2 bg-slate-50 dark:bg-slate-800/80 transition-all ${
                dragOver ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-300 dark:border-slate-700"
              }`}
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
                    onClick={() => { setSelectedFile(null); setResult(null); setError(null); }}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={!selectedFile || isAnalyzing}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-emerald-500/20"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Satellite className="w-4 h-4" /> {selectedFile ? "Run AI Analysis" : "Select an Image to Analyze"}</>
            )}
          </button>

          {/* Model info cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Detection",       arch: "EfficientNet-B0", details: ["Binary: cyclone / no cyclone", "Confidence score output", "224×224 IR input"] },
              { title: "Classification",  arch: "ResNet50",        details: ["5 classes: TD/TS/CAT1–3+", "Per-class probability", "Saffir-Simpson scale"] },
            ].map(({ title, arch, details }) => (
              <div key={title} className="card p-3">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mb-2">{arch}</p>
                <ul className="space-y-0.5">
                  {details.map((d) => (
                    <li key={d} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5">
                      <span className="text-emerald-400 flex-shrink-0">▸</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Results panel */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Analysis Results</h2>
            <DataTypeBadge type={result?.metadata?.data_type ?? "PREDICTED"} />
          </div>
          <AnalysisPanel result={result} isLoading={isAnalyzing} error={error} />
        </div>
      </div>

    </div>
  );
}
