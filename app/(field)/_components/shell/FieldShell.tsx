"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navItems, localize } from "@/lib/harvestly-content";
import { IconFrame } from "./NavIcon";
import { BotanicalSprig } from "../ui/BotanicalSprig";
import { EntryLoader } from "./EntryLoader";
import { useProduct } from "../state/ProductProvider";

export function FieldShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage } = useProduct();
  return (
    <div className="field-shell" lang={language}>
      <EntryLoader language={language} />
      <aside className="field-sidebar">
        <Link className="brand" href="/" aria-label="Harvestly">
          <svg className="brand-mark" viewBox="0 0 88 82" aria-hidden="true">
            <path className="rice-stem" d="M42 75c1-22 3-41 1-63m0 50C33 53 28 43 25 32m18 19C54 45 60 35 62 23M43 41C35 36 31 27 30 18m13 13C52 26 57 18 59 10" />
            <path className="rice-grain" d="M28 20c-7-2-10 3-8 8 6 1 9-3 8-8Zm-2 14c-7-1-10 4-7 9 6 0 8-4 7-9Zm7 13c-7 1-8 6-4 10 6-2 7-6 4-10ZM58 12c7-3 10 1 9 7-6 2-9-2-9-7Zm3 14c7-2 10 3 8 8-6 1-9-3-8-8Zm-6 13c7 0 9 5 5 10-6-1-8-5-5-10Z" />
            <path className="rice-ground" d="M20 75h47m-39 5h31" />
          </svg>
          <strong>HARVESTLY</strong>
          <small>ដំណាំល្អ ដីស្រែយើង</small>
        </Link>
        <nav className="rail-nav" aria-label={language === "km" ? "ម៉ឺនុយចម្បង" : "Primary navigation"}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`rail-link ${pathname === item.href ? "active" : ""}`}>
              <IconFrame name={item.icon} />
              <span>{localize(item.label, language)}</span>
            </Link>
          ))}
        </nav>
        <div className="temple-relief" aria-hidden="true">
          <svg viewBox="0 0 210 122">
            <path className="relief-palms" d="M18 76V35m0 9C9 37 7 31 8 24c8 1 12 8 10 20Zm0-3c2-12 9-18 17-17 0 8-7 13-17 17ZM193 77V25m0 13c-10-7-11-14-8-22 8 3 10 11 8 22Zm0-5c2-13 10-20 18-18 0 8-7 14-18 18ZM38 77V47m0 7c-7-5-8-11-6-17 7 2 8 8 6 17Zm0-3c3-9 8-13 14-11 0 6-5 9-14 11ZM172 77V45m0 8c-7-5-8-11-5-17 6 2 8 8 5 17Zm0-3c2-9 8-14 14-12 0 6-5 10-14 12Z" />
            <path className="relief-tower" d="M13 90h184M24 90V79h21V72h14V63h12V49h8V38h6V23h4V13h3V7h3v6h3v10h4v15h6v11h8v14h12v9h14v7h21v11M76 90V62h58v28M83 62V50h44v12M88 50V39h34v11M92 39V27h26v12M96 27V16h18v11M101 16 105 5l4 11" />
            <path className="relief-gallery" d="M24 79h52m58 0h52M30 79V69h35v10m80 0V69h35v10M37 69v-8h20v8m96 0v-8h20v8M13 90v-7h11m173 7v-7h-11M47 90V78m11 12V78m95 12V78m11 12V78" />
            <path className="relief-doorways" d="M89 90V75h11v15m10 0V75h11v15M93 75l3-5 4 5m10 0 6-7 5 7M41 79v-8h8v8m112 0v-8h8v8" />
            <path className="relief-detail" d="M22 94h168M32 98h147M8 105c19-6 34 5 52 0s31-5 48 0 34 5 51 0 29-5 44 0M26 113c20-5 33 4 50 0s35-5 51 0 30 4 53-1" />
          </svg>
        </div>
        <LanguageSwitch language={language} setLanguage={setLanguage} />
      </aside>
      <main className="field-main">
        <BotanicalSprig className="shell-sprig" />
        {children}
      </main>
      <nav className="mobile-nav" aria-label={language === "km" ? "ម៉ឺនុយចម្បង" : "Primary navigation"}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
            <IconFrame name={item.icon} />
            <span>{localize(item.label, language)}</span>
          </Link>
        ))}
        <button className="mobile-language" onClick={() => setLanguage(language === "km" ? "en" : "km")} type="button">
          {language === "km" ? "EN" : "ខ្មែរ"}
        </button>
      </nav>
    </div>
  );
}

function LanguageSwitch({ language, setLanguage }: { language: "km" | "en"; setLanguage: (language: "km" | "en") => void }) {
  return (
    <div className="language-switch" role="group" aria-label={language === "km" ? "ជ្រើសភាសា" : "Language"}>
      <button className={language === "km" ? "selected" : ""} onClick={() => setLanguage("km")} type="button">ខ្មែរ</button>
      <button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} type="button">EN</button>
    </div>
  );
}
