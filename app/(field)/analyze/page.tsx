"use client";

import { PhotoGuidance } from "../_components/analyze/PhotoGuidance";
import { ScanUploader } from "../_components/analyze/ScanUploader";
import { useProduct } from "../_components/state/ProductProvider";

export default function AnalyzePage() {
  const { language, analysisStatus } = useProduct();
  const hasResult = analysisStatus === "result";

  return (
    <div className="route-page analyze-page">
      <header className="route-header">
        <p className="eyebrow">{language === "km" ? "ការពិនិត្យដំណាំ" : "Crop review"}</p>
        <h1>{language === "km" ? "ពិនិត្យរូបស្លឹករបស់អ្នក" : "Analyze a leaf photo"}</h1>
        <p>
          {language === "km"
            ? "ប្រើរូបថតច្បាស់នៃស្លឹក ឬដើមដែលមានសញ្ញាមិនប្រក្រតី។"
          : "Use a clear photo of a leaf or stem showing unusual symptoms."}
        </p>
      </header>
      <div className={`analysis-workspace ${hasResult ? "has-result" : ""}`}>
        <ScanUploader />
        <PhotoGuidance language={language} />
      </div>
    </div>
  );
}
