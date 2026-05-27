import { localize, photoGuidance, photoTips, type Language } from "@/lib/harvestly-content";

export function PhotoGuidance({ language }: { language: Language }) {
  return (
    <aside className="photo-guidance dark-panel" aria-labelledby="photo-guidance-title">
      <p className="guidance-eyebrow">{localize(photoGuidance.eyebrow, language)}</p>
      <h2 id="photo-guidance-title">{localize(photoGuidance.title, language)}</h2>
      <p className="guidance-support">{localize(photoGuidance.support, language)}</p>
      <ol className="photo-tips">
        {photoTips.map((tip, index) => (
          <li key={tip.title.en}>
            <b aria-hidden="true">{index + 1}</b>
            <div>
              <h3>{localize(tip.title, language)}</h3>
              <p>{localize(tip.body, language)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="photo-avoid">
        <strong>{localize(photoGuidance.avoidLabel, language)}:</strong> {localize(photoGuidance.avoid, language)}
      </p>
    </aside>
  );
}
