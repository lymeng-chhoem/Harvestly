import { guideSteps, localize, type Language } from "@/lib/harvestly-content";
import { Reveal } from "../ui/Reveal";

const heading = { km: "របៀបប្រើប្រាស់", en: "How it works" };

export function HowItWorksPanel({ language }: { language: Language }) {
  return (
    <Reveal>
      <section className="steps-panel dark-panel">
        <h2>{localize(heading, language)}</h2>
        {guideSteps.map((step, index) => (
          <div className="step" key={step.title.en}>
            <b>{index + 1}</b>
            <div>
              <h3>{localize(step.title, language)}</h3>
              <p>{localize(step.body, language)}</p>
            </div>
          </div>
        ))}
      </section>
    </Reveal>
  );
}
