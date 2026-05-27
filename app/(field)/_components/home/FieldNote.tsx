import type { Language } from "@/lib/harvestly-content";
import { Reveal } from "../ui/Reveal";

export function FieldNote({ language }: { language: Language }) {
  return (
    <Reveal>
      <aside className="field-note">
        {language === "km"
          ? "ចំណាំ៖ ប្រសិនបើដំណាំខូចខាតលឿន សូមទាក់ទងមន្ត្រីកសិកម្មក្នុងមូលដ្ឋាន។"
          : "Field note: If damage spreads quickly, contact a local agricultural officer."}
      </aside>
    </Reveal>
  );
}
