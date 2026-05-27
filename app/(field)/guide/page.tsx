"use client";

import Link from "next/link";
import { useProduct } from "../_components/state/ProductProvider";
import { diseases, localize, riskText } from "@/lib/harvestly-content";

export default function GuidePage() {
  const { language } = useProduct();
  return (
    <div className="route-page">
      <header className="route-header compact">
        <p className="eyebrow">{language === "km" ? "មគ្គុទេសក៍វាល" : "Field guide"}</p>
        <h1>{language === "km" ? "រោគសញ្ញាស្រូវ និងដំឡូងមី" : "Rice and cassava symptoms"}</h1>
        <p>{language === "km" ? "ប្រៀបធៀបរោគសញ្ញា ហើយពិគ្រោះអ្នកជំនាញមុនប្រើថ្នាំ។" : "Compare symptoms and seek expert advice before using treatment."}</p>
      </header>
      <div className="guide-grid">
        {diseases.map((disease) => (
          <article className="reference-card" key={disease.id}>
            <div className={`disease-image ${disease.imageClass}`} aria-hidden="true" />
            <div>
              <small>{localize(disease.crop, language)}</small>
              <h2>{localize(disease.name, language)}</h2>
              <p>{localize(disease.symptoms, language)}</p>
              <span className={`risk-chip ${disease.risk}`}>{riskText(disease.risk, language)}</span>
            </div>
          </article>
        ))}
      </div>
      <section className="advisory parchment-panel">
        <h2>{language === "km" ? "សុវត្ថិភាពមុនព្យាបាល" : "Safety before treatment"}</h2>
        <p>{language === "km" ? "កុំលាយ ឬបាញ់ថ្នាំដោយផ្អែកលើរូបថតតែមួយ។ រក្សាសំណាក និងទាក់ទងមន្ត្រីកសិកម្មនៅជិតអ្នក។" : "Do not mix or spray treatment based on one photograph. Retain samples and contact a nearby agricultural officer."}</p>
        <Link className="rust-button inline-action" href="/analyze">{language === "km" ? "ថតរូបស្លឹក" : "Photograph a leaf"}</Link>
      </section>
    </div>
  );
}
