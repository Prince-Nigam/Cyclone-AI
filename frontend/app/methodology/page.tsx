import React from "react";

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">ML Methodology</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Technical explanation of the AI/ML pipeline used in this platform.
        </p>
      </div>

      {/* Info stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔬</span>
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wide">AI Models Used</p>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-200">EfficientNet · ResNet50 · LSTM</p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">Detection · Classification · Intensity · Track</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">Training Data</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">HURSAT-B1 + IBTrACS</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Train ≤ 2010 · Val 2011–13 · Test 2014–15</p>
          </div>
        </div>
      </div>

      {[
        {
          title: "1. Cyclone Detection",
          content: [
            "Architecture: EfficientNet-B0 (ImageNet pretrained, fine-tuned)",
            "Input: 224×224 single-channel infrared satellite image",
            "Output: Binary (cyclone / no cyclone) + confidence score",
            "Training data: HURSAT-B1 + IBTrACS labels",
            "Loss: Binary Cross-Entropy | Optimizer: AdamW",
          ],
        },
        {
          title: "2. Pattern Classification",
          content: [
            "Architecture: ResNet50 (transfer learning)",
            "Classes: TD / TS / CAT1 / CAT2 / CAT3_PLUS (from IBTrACS Saffir-Simpson)",
            "Input: 224×224 infrared satellite image",
            "Output: Intensity class + probability distribution",
            "Loss: CrossEntropyLoss with class weights for imbalance",
          ],
        },
        {
          title: "3. Intensity Prediction",
          content: [
            "Architecture: CNN feature extractor (EfficientNet) + LSTM(256) regressor",
            "Input: Image features + historical [lat, lon, wind, pressure] sequence (4 steps)",
            "Output: Predicted wind speed (kt) and central pressure (hPa)",
            "Metrics: MAE, RMSE, R²",
            "Training data: IBTrACS historical records (1978–2015)",
          ],
        },
        {
          title: "4. Track Prediction",
          content: [
            "Architecture: Encoder-Decoder LSTM (Seq2Seq)",
            "Input: Last 8 time steps [lat, lon, wind, pressure] (24h history)",
            "Output: Next 8 time steps [lat, lon] (24h horizon)",
            "Metric: Mean Haversine Distance Error (km)",
            "Teacher forcing ratio: 0.5 during training",
          ],
        },
        {
          title: "5. Multi-Source Fusion",
          content: [
            "Strategy: Feature-level fusion",
            "Source A (HURSAT-B1): IR image → EfficientNet → 1280-dim feature vector",
            "Source B (INSAT-3D): TIR1 image → EfficientNet → 1280-dim feature vector",
            "Fusion: Concatenate [feat_A, feat_B] → MLP(1024→512→256) → prediction head",
            "Fallback: Zero vector used when source unavailable (clearly flagged)",
          ],
        },
        {
          title: "6. Explainable AI (Grad-CAM)",
          content: [
            "Method: Gradient-weighted Class Activation Mapping (Selvaraju et al., 2017)",
            "Target layer: Last convolutional block of detection/classification model",
            "Output: Heatmap overlay showing model attention regions",
            "Disclaimer: Heatmap shows model attention — not a meteorological analysis",
          ],
        },
        {
          title: "7. Data Split Strategy",
          content: [
            "NOT random splitting — prevents data leakage from same cyclone in train/test",
            "Train: Storms with start year ≤ 2010",
            "Validation: Storms 2011–2013",
            "Test: Storms 2014–2015",
            "This ensures model is evaluated on unseen storms",
          ],
        },
      ].map(({ title, content }) => (
        <div key={title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</h2>
          <ul className="space-y-1.5">
            {content.map((item, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-blue-500 mt-1 flex-shrink-0">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-5">
        <h2 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Important Limitations</h2>
        <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
          <li>• HURSAT-B1 data covers 1978–2015 only. Recent storm patterns may not be represented.</li>
          <li>• Models trained on single IR channel. Multi-channel input would improve accuracy.</li>
          <li>• Track prediction limited to 24h. Beyond 72h, errors increase significantly.</li>
          <li>• Not validated against operational IMD/JTWC forecasts.</li>
          <li>• Class imbalance: CAT3+ storms are rare; minority class performance may be lower.</li>
        </ul>
      </div>
    </div>
  );
}
