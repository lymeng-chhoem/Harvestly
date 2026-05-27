import type { LocalizedText, RiskLevel, StoredScanRecord } from "@/lib/harvestly-content";

export const SCAN_HISTORY_STORAGE_KEY = "harvestly-scan-history:v1";
export const MAX_STORED_SCANS = 30;
export type HistoryFilter = "all" | "high" | "rice" | "cassava";

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") return false;
  const text = value as Partial<LocalizedText>;
  return typeof text.km === "string" && typeof text.en === "string";
}

function isRisk(value: unknown): value is RiskLevel {
  return value === "high" || value === "medium" || value === "low";
}

function isStoredScanRecord(value: unknown): value is StoredScanRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredScanRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.createdAt === "string" &&
    !Number.isNaN(Date.parse(record.createdAt)) &&
    (record.cropId === "rice" || record.cropId === "cassava" || record.cropId === "unknown") &&
    typeof record.conditionCode === "string" &&
    typeof record.confidence === "number" &&
    record.confidence >= 0 &&
    record.confidence <= 1 &&
    isRisk(record.risk) &&
    isLocalizedText(record.crop) &&
    isLocalizedText(record.finding) &&
    isLocalizedText(record.summary) &&
    Array.isArray(record.actions) &&
    record.actions.every(isLocalizedText) &&
    typeof record.unrecognizedCondition === "boolean"
  );
}

export function parseScanHistory(rawValue: string | null): StoredScanRecord[] {
  if (!rawValue) return [];
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredScanRecord)
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
      .slice(0, MAX_STORED_SCANS);
  } catch {
    return [];
  }
}

export function readScanHistory(): StoredScanRecord[] {
  try {
    return parseScanHistory(window.localStorage.getItem(SCAN_HISTORY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveScanHistory(records: StoredScanRecord[]): boolean {
  try {
    window.localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(records.slice(0, MAX_STORED_SCANS)));
    return true;
  } catch {
    return false;
  }
}

export function prependScanRecord(records: StoredScanRecord[], record: StoredScanRecord): StoredScanRecord[] {
  return [record, ...records.filter((entry) => entry.id !== record.id)].slice(0, MAX_STORED_SCANS);
}

export function filterScanHistory(records: StoredScanRecord[], filter: HistoryFilter): StoredScanRecord[] {
  if (filter === "high") return records.filter((record) => record.risk === "high");
  if (filter === "rice" || filter === "cassava") return records.filter((record) => record.cropId === filter);
  return records;
}
