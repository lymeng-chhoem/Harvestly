import Image from "next/image";
import { localize, type Language } from "@/lib/harvestly-content";
import { BotanicalSprig } from "../ui/BotanicalSprig";
import { Reveal } from "../ui/Reveal";

const text = {
  eyebrow: { km: "ការពារដំណាំគ្រួសារ", en: "Protect the family harvest" },
  title: { km: "រកឃើញជំងឺដំណាំ\nមុនពេលហួសពេល", en: "Identify crop trouble\nbefore it spreads" },
  support: {
    km: "ថតរូបស្លឹកដែលកំពុងប្រែពណ៌ ដើម្បីទទួលបានជំហានបន្ទាប់ដែលងាយយល់នៅវាល។",
    en: "Capture a changing leaf to receive clear next steps while you are still in the field.",
  },
};

export function HeroBanner({ language }: { language: Language }) {
  return (
    <Reveal className="hero-reveal">
      <section className="hero">
        <Image src="/images/harvestly-hero.webp" alt="" fill priority className="hero-image" />
        <div className="hero-copy">
          <p className="eyebrow">{localize(text.eyebrow, language)}</p>
          <h1>{localize(text.title, language)}</h1>
          <p>{localize(text.support, language)}</p>
        </div>
        <BotanicalSprig className="hero-sprig" />
        <div className="hero-etch" aria-hidden="true"><span /><span /><span /></div>
      </section>
    </Reveal>
  );
}
