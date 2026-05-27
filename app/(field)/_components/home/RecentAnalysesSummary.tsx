"use client";

import Link from "next/link";
import { localize, riskText, scanDateText, type Language } from "@/lib/harvestly-content";
import { Reveal } from "../ui/Reveal";
import { useProduct } from "../state/ProductProvider";

const text = {
  recent: { km: "ប្រវត្តិពិនិត្យថ្មីៗ", en: "Recent analyses" },
  local: { km: "រក្សាទុកលើឧបករណ៍នេះ", en: "Saved on this device" },
  viewAll: { km: "មើលទាំងអស់", en: "View all" },
  empty: { km: "មិនទាន់មានលទ្ធផលដែលបានរក្សាទុក។", en: "No saved scan results yet." },
  start: { km: "ពិនិត្យរូបដំបូង", en: "Analyze a photo" },
};

export function RecentAnalysesSummary({ language }: { language: Language }) {
  const { historyRecords } = useProduct();
  const recentRecords = historyRecords.slice(0, 3);

  return (
    <Reveal>
      <section className="dark-panel history-panel">
        <header className="panel-head">
          <div>
            <h2>{localize(text.recent, language)}</h2>
            <small>{localize(text.local, language)}</small>
          </div>
          <Link href="/history">{localize(text.viewAll, language)}</Link>
        </header>
        {recentRecords.length === 0 ? (
          <div className="home-history-empty">
            <p>{localize(text.empty, language)}</p>
            <Link href="/analyze">{localize(text.start, language)}</Link>
          </div>
        ) : recentRecords.map((entry) => (
          <article className="history-row" key={entry.id}>
            <div className="history-leaf" aria-hidden="true" />
            <div>
              <h3>{localize(entry.finding, language)}</h3>
              <p>{localize(entry.crop, language)} &middot; {scanDateText(entry.createdAt, language)}</p>
            </div>
            <strong className={`risk-chip ${entry.risk}`}>{riskText(entry.risk, language)}</strong>
          </article>
        ))}
      </section>
    </Reveal>
  );
}
