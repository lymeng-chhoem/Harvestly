import type { User } from "@supabase/supabase-js";
import { createStoredScanRecord, type ModelAnalysisResponse } from "@/lib/harvestly-content";
import { REGISTERED_WEEKLY_SCAN_LIMIT, type ScanAllowance } from "@/lib/scan-usage";

const ACCOUNT_HISTORY_KEY = "harvestly_scan_history";
const ACCOUNT_USAGE_KEY = "harvestly_scan_usage";
const MAX_ACCOUNT_HISTORY = 30;
const ACCOUNT_TIME_ZONE = "Asia/Phnom_Penh";

type SavedScan = ModelAnalysisResponse & {
  id: string;
  createdAt: string;
};

function weekBounds(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ACCOUNT_TIME_ZONE,
  }).formatToParts(now);
  const part = (type: string) => dateParts.find((entry) => entry.type === type)?.value ?? "";
  const localDate = `${part("year")}-${part("month")}-${part("day")}`;
  const localMidnight = new Date(`${localDate}T00:00:00+07:00`);
  const daysSinceMonday = (localMidnight.getUTCDay() + 6) % 7;
  const start = new Date(localMidnight);
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const reset = new Date(start);
  reset.setUTCDate(reset.getUTCDate() + 7);
  return { start: start.getTime(), reset };
}

function isSavedScan(value: unknown): value is SavedScan {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<SavedScan>;
  return (
    typeof record.id === "string"
    && typeof record.createdAt === "string"
    && !Number.isNaN(Date.parse(record.createdAt))
    && (record.cropId === "rice" || record.cropId === "cassava" || record.cropId === "unknown")
    && typeof record.conditionCode === "string"
    && typeof record.confidence === "number"
    && record.confidence >= 0
    && record.confidence <= 1
    && (record.risk === "high" || record.risk === "medium" || record.risk === "low")
  );
}

function savedHistory(user: User) {
  const value: unknown = user.user_metadata?.[ACCOUNT_HISTORY_KEY];
  if (!Array.isArray(value)) return [];
  return value.filter(isSavedScan).slice(0, MAX_ACCOUNT_HISTORY);
}

function currentWeekUsage(user: User) {
  const value: unknown = user.user_metadata?.[ACCOUNT_USAGE_KEY];
  const { start, reset } = weekBounds();
  const uses = Array.isArray(value)
    ? value.filter((entry): entry is string => {
      if (typeof entry !== "string") return false;
      const timestamp = Date.parse(entry);
      return !Number.isNaN(timestamp) && timestamp >= start && timestamp < reset.getTime();
    })
    : [];
  return { uses, reset };
}

export function registeredScanState(user: User) {
  const { uses, reset } = currentWeekUsage(user);
  const allowance: ScanAllowance = {
    kind: "registered",
    limit: REGISTERED_WEEKLY_SCAN_LIMIT,
    used: uses.length,
    remaining: Math.max(0, REGISTERED_WEEKLY_SCAN_LIMIT - uses.length),
    resetsAt: reset.toISOString(),
  };
  const records = savedHistory(user).map((saved) => createStoredScanRecord(saved, saved));
  return { allowance, records, uses };
}

export function addRegisteredScan(user: User, analysis: ModelAnalysisResponse) {
  const record = createStoredScanRecord(analysis);
  const state = registeredScanState(user);
  const savedRecord: SavedScan = {
    id: record.id,
    createdAt: record.createdAt,
    cropId: record.cropId,
    conditionCode: record.conditionCode,
    confidence: record.confidence,
    risk: record.risk,
  };
  const nextHistory = [savedRecord, ...savedHistory(user).filter((entry) => entry.id !== record.id)]
    .slice(0, MAX_ACCOUNT_HISTORY);
  const nextUses = [...state.uses, record.createdAt];
  const allowance: ScanAllowance = {
    ...state.allowance,
    used: nextUses.length,
    remaining: Math.max(0, REGISTERED_WEEKLY_SCAN_LIMIT - nextUses.length),
  };
  return {
    record,
    allowance,
    metadata: {
      [ACCOUNT_HISTORY_KEY]: nextHistory,
      [ACCOUNT_USAGE_KEY]: nextUses,
    },
  };
}

export function hideRegisteredScan(user: User, id: string) {
  return {
    [ACCOUNT_HISTORY_KEY]: savedHistory(user).filter((entry) => entry.id !== id),
  };
}

export function clearRegisteredHistory() {
  return { [ACCOUNT_HISTORY_KEY]: [] };
}
