"use client";

import { useState } from "react";
import Link from "next/link";
import { confidenceText, localize, riskText, scanDateText } from "@/lib/harvestly-content";
import { filterScanHistory, type HistoryFilter } from "@/lib/scan-history";
import { useProduct } from "../_components/state/ProductProvider";

const text = {
  eyebrow: { km: "ប្រវត្តិ", en: "History" },
  title: { km: "ការពិនិត្យថ្មីៗ", en: "Recent crop checks" },
  subtitle: {
    km: "លទ្ធផលពិនិត្យដែលបានបញ្ចប់ត្រូវបានរក្សាទុកនៅលើឧបករណ៍នេះប៉ុណ្ណោះ។ រូបថតមិនត្រូវបានរក្សាទុកទេ។",
    en: "Completed scan results are saved on this device only. Photos are not kept in history.",
  },
  filtersLabel: { km: "តម្រង", en: "Filters" },
  filters: {
    all: { km: "ទាំងអស់", en: "All" },
    high: { km: "ហានិភ័យខ្ពស់", en: "High risk" },
    rice: { km: "ស្រូវ", en: "Rice" },
    cassava: { km: "ដំឡូងមី", en: "Cassava" },
  },
  details: { km: "ព័ត៌មានលម្អិត", en: "Details" },
  hide: { km: "បិទ", en: "Hide" },
  next: { km: "ជំហានសុវត្ថិភាពបន្ទាប់", en: "Safe next actions" },
  caution: {
    km: "សូមប្រើលទ្ធផលនេះជាការណែនាំប៉ុណ្ណោះ ហើយបញ្ជាក់ជាមួយមន្ត្រីកសិកម្ម មុនប្រើថ្នាំព្យាបាល។",
    en: "Use this result as guidance only and confirm with an agricultural officer before applying treatment.",
  },
  unknown: {
    km: "សេវាពិនិត្យបានផ្តល់លទ្ធផលដែលមិនទាន់មានក្នុងបញ្ជីរបស់ Harvestly។",
    en: "The scanner returned a condition not yet represented in Harvestly's guide.",
  },
  delete: { km: "លុបលទ្ធផលនេះ", en: "Delete result" },
  clear: { km: "លុបប្រវត្តិទាំងអស់", en: "Clear history" },
  clearConfirm: { km: "លុបប្រវត្តិពិនិត្យទាំងអស់ពីឧបករណ៍នេះមែនទេ?", en: "Clear all saved scan history from this device?" },
  deleteConfirm: { km: "លុបលទ្ធផលពិនិត្យនេះមែនទេ?", en: "Delete this saved scan result?" },
  emptyTitle: { km: "មិនទាន់មានប្រវត្តិពិនិត្យ", en: "No saved scans yet" },
  emptyBody: {
    km: "ថតស្លឹកដែលមានបញ្ហា ដើម្បីទទួលបានលទ្ធផល និងរក្សាទុកវានៅទីនេះ។",
    en: "Analyze an affected leaf to create your first saved result on this device.",
  },
  noMatch: { km: "មិនមានលទ្ធផលត្រូវនឹងតម្រងនេះទេ។", en: "No saved scans match this filter." },
  resetFilter: { km: "មើលទាំងអស់", en: "Show all" },
  analyze: { km: "ពិនិត្យរូបថ្មី", en: "Analyze new photo" },
  saveError: {
    km: "មិនអាចផ្លាស់ប្តូរប្រវត្តិនៅលើឧបករណ៍នេះបានទេ។",
    en: "History could not be updated on this device.",
  },
};

const filters: HistoryFilter[] = ["all", "high", "rice", "cassava"];

export default function HistoryPage() {
  const {
    language,
    authStatus,
    allowance,
    historyRecords,
    historyFilter,
    setHistoryFilter,
    historySaveError,
    deleteHistoryRecord,
    clearHistory,
  } = useProduct();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleRecords = filterScanHistory(historyRecords, historyFilter);

  function removeRecord(id: string) {
    if (window.confirm(localize(text.deleteConfirm, language))) {
      deleteHistoryRecord(id);
      if (expandedId === id) setExpandedId(null);
    }
  }

  function removeAll() {
    if (window.confirm(localize(text.clearConfirm, language))) {
      clearHistory();
      setExpandedId(null);
      setHistoryFilter("all");
    }
  }

  return (
    <div className="route-page">
      <header className="route-header compact">
        <p className="eyebrow">{localize(text.eyebrow, language)}</p>
        <h1>{localize(text.title, language)}</h1>
        <p>{authStatus === "authenticated"
          ? (language === "km" ? "លទ្ធផលពិនិត្យដែលបានបញ្ចប់ត្រូវបានរក្សាទុកក្នុងគណនីរបស់អ្នក។ រូបថតមិនត្រូវបានរក្សាទុកទេ។" : "Completed results are saved to your account. Photos are never saved.")
          : localize(text.subtitle, language)}</p>
        {authStatus === "authenticated" && allowance && (
          <p className="history-allowance">{language === "km" ? "ការពិនិត្យនៅសល់ក្នុងសប្តាហ៍នេះ" : "Scans remaining this week"}: {allowance.remaining}/{allowance.limit}</p>
        )}
      </header>
      <section className="ledger dark-panel">
        <div className="ledger-toolbar">
          <div className="filter-pills" aria-label={localize(text.filtersLabel, language)}>
            {filters.map((filter) => (
              <button
                className={historyFilter === filter ? "selected" : undefined}
                type="button"
                aria-pressed={historyFilter === filter}
                key={filter}
                onClick={() => setHistoryFilter(filter)}
              >
                {localize(text.filters[filter], language)}
              </button>
            ))}
          </div>
          {historyRecords.length > 0 && (
            <button className="text-button clear-history" type="button" onClick={removeAll}>
              {localize(text.clear, language)}
            </button>
          )}
        </div>
        {historySaveError && <p className="history-storage-error" role="alert">{localize(text.saveError, language)}</p>}
        {historyRecords.length === 0 ? (
          <div className="history-empty">
            <h2>{localize(text.emptyTitle, language)}</h2>
            <p>{localize(text.emptyBody, language)}</p>
            <Link className="rust-button inline-action" href="/analyze">{localize(text.analyze, language)}</Link>
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="history-empty compact-empty">
            <p>{localize(text.noMatch, language)}</p>
            <button className="paper-button" type="button" onClick={() => setHistoryFilter("all")}>
              {localize(text.resetFilter, language)}
            </button>
          </div>
        ) : (
          <>
            {visibleRecords.map((entry) => {
              const expanded = entry.id === expandedId;
              return (
                <article className={`ledger-entry ${expanded ? "expanded" : ""}`} key={entry.id}>
                  <button
                    className="ledger-row ledger-toggle"
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <div className="ledger-primary">
                      <small>{scanDateText(entry.createdAt, language)}</small>
                      <h2>{localize(entry.finding, language)}</h2>
                      <p>{localize(entry.crop, language)}</p>
                    </div>
                    <span className={`risk-chip ${entry.risk}`}>{riskText(entry.risk, language)}</span>
                    <span className="detail-label">{localize(expanded ? text.hide : text.details, language)}</span>
                  </button>
                  {expanded && (
                    <div className="ledger-detail">
                      <p className="confidence">{confidenceText(entry.confidence, language)}</p>
                      <p>{localize(entry.summary, language)}</p>
                      {entry.unrecognizedCondition && <p className="unknown-condition">{localize(text.unknown, language)}</p>}
                      <div className="disclosure" role="note">{localize(text.caution, language)}</div>
                      <h3>{localize(text.next, language)}</h3>
                      <ol>
                        {entry.actions.map((action) => <li key={action.en}>{localize(action, language)}</li>)}
                      </ol>
                      <button className="text-button delete-history" type="button" onClick={() => removeRecord(entry.id)}>
                        {localize(text.delete, language)}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            <Link className="rust-button inline-action history-new-scan" href="/analyze">{localize(text.analyze, language)}</Link>
          </>
        )}
      </section>
    </div>
  );
}
