import type { CSSProperties } from "react";
import { localize, scanReadiness, type Language } from "@/lib/harvestly-content";
import { ScanUploader } from "../analyze/ScanUploader";
import { Reveal } from "../ui/Reveal";

const text = {
  readiness: { km: "ត្រៀមរូបថតឱ្យច្បាស់", en: "Prepare a clear photo" },
  readinessNote: {
    km: "ភាគរយនេះជាគន្លឹះត្រៀមថត មិនមែនជាលទ្ធផលពិនិត្យទេ។",
    en: "These percentages guide photo preparation, not analysis results.",
  },
};

export function HomeUploadArea({ language }: { language: Language }) {
  return (
    <div className="scan-stack">
      <Reveal>
        <ScanUploader home />
      </Reveal>
      <Reveal>
        <section className="readiness-panel parchment-panel">
          <header>
            <h2>{localize(text.readiness, language)}</h2>
            <p>{localize(text.readinessNote, language)}</p>
          </header>
          {scanReadiness.map((entry) => (
            <div className="meter-row readiness-meter" key={entry.label.en}>
              <div>
                <span>{localize(entry.label, language)}</span>
                <strong>{entry.percentage}%</strong>
              </div>
              <span className="meter-track">
                <span style={{ "--meter": `${entry.percentage}%` } as CSSProperties} />
              </span>
            </div>
          ))}
        </section>
      </Reveal>
    </div>
  );
}
