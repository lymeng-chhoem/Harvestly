import Link from "next/link";
import type { CSSProperties } from "react";
import { diseases, localize, riskText, type Language } from "@/lib/harvestly-content";
import { Reveal } from "../ui/Reveal";

const text = {
  diseases: { km: "ជំងឺដែលជួបញឹកញាប់", en: "Common crop problems" },
  referenceNote: { km: "ហានិភ័យគំរូ មិនមែនជាការវិនិច្ឆ័យផ្ទាល់", en: "Demonstration risk only, not a live diagnosis" },
  viewGuide: { km: "មើលការណែនាំ", en: "View guide" },
};

export function CropProblemsSummary({ language }: { language: Language }) {
  return (
    <Reveal>
      <section className="dark-panel disease-panel">
        <header className="panel-head">
          <div>
            <h2>{localize(text.diseases, language)}</h2>
            <small>{localize(text.referenceNote, language)}</small>
          </div>
          <Link href="/guide">{localize(text.viewGuide, language)}</Link>
        </header>
        <div className="disease-cards">
          {diseases.map((disease) => (
            <article className="disease-card" key={disease.id}>
              <div className={`disease-image ${disease.imageClass}`} aria-hidden="true" />
              <span>{localize(disease.crop, language)}</span>
              <h3>{localize(disease.name, language)}</h3>
              <p>{localize(disease.symptoms, language)}</p>
              <div className={`meter-row risk-meter ${disease.risk}`}>
                <div><small>{language === "km" ? "គំរូ" : "Demo"}</small><strong>{disease.demoPercentage}%</strong></div>
                <span className="meter-track"><span style={{ "--meter": `${disease.demoPercentage}%` } as CSSProperties} /></span>
              </div>
              <strong className={`risk-chip ${disease.risk}`}>{riskText(disease.risk, language)}</strong>
            </article>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
