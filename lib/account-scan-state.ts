import type { SupabaseClient } from "@supabase/supabase-js";
import { createStoredScanRecord, type ModelAnalysisResponse } from "@/lib/harvestly-content";
import { REGISTERED_WEEKLY_SCAN_LIMIT, type ScanAllowance } from "@/lib/scan-usage";

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
    && (record.cropId === "rice" || record.cropId === "cassava" || record.cropId === "unknown")
    && typeof record.conditionCode === "string"
    && typeof record.confidence === "number"
    && record.confidence >= 0
    && record.confidence <= 1
    && (record.risk === "high" || record.risk === "medium" || record.risk === "low")
  );
}

type ScanUsageRow = {
  id: string;
  completed_at: string | null;
  crop_id: string | null;
  condition_code: string | null;
  confidence: number | null;
  risk: string | null;
};

function scanFromRow(row: ScanUsageRow): SavedScan | null {
  const saved = {
    id: row.id,
    createdAt: row.completed_at ?? "",
    cropId: row.crop_id,
    conditionCode: row.condition_code,
    confidence: row.confidence,
    risk: row.risk,
  };
  return isSavedScan(saved) && saved.createdAt && !Number.isNaN(Date.parse(saved.createdAt)) ? saved : null;
}

export async function registeredScanState(supabase: SupabaseClient, userId: string) {
  const { start, reset } = weekBounds();
  const weekStart = new Date(start).toISOString().slice(0, 10);
  const usage = await supabase
    .from("scan_usage")
    .select("id, completed_at, crop_id, condition_code, confidence, risk")
    .eq("user_id", userId)
    .eq("status", "succeeded")
    .is("hidden_at", null)
    .order("completed_at", { ascending: false })
    .limit(MAX_ACCOUNT_HISTORY);
  if (usage.error) return { error: usage.error, state: null };

  const count = await supabase
    .from("scan_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .eq("status", "succeeded");
  if (count.error) return { error: count.error, state: null };

  const used = count.count ?? 0;
  const allowance: ScanAllowance = {
    kind: "registered",
    limit: REGISTERED_WEEKLY_SCAN_LIMIT,
    used,
    remaining: Math.max(0, REGISTERED_WEEKLY_SCAN_LIMIT - used),
    resetsAt: reset.toISOString(),
  };
  const records = (usage.data ?? [])
    .map(scanFromRow)
    .filter((scan): scan is SavedScan => Boolean(scan))
    .map((saved) => createStoredScanRecord(saved, saved));

  return { error: null, state: { allowance, records } };
}

export async function addRegisteredScan(supabase: SupabaseClient, userId: string, analysis: ModelAnalysisResponse) {
  const { start, reset } = weekBounds();
  const weekStart = new Date(start).toISOString().slice(0, 10);
  const state = await registeredScanState(supabase, userId);
  if (state.error || !state.state) return { error: state.error, saved: null };
  if (state.state.allowance.remaining === 0) {
    return {
      error: null,
      saved: {
        record: null,
        allowance: state.state.allowance,
      },
    };
  }

  const record = createStoredScanRecord(analysis);
  const inserted = await supabase
    .from("scan_usage")
    .insert({
      id: record.id,
      user_id: userId,
      week_start: weekStart,
      status: "succeeded",
      completed_at: record.createdAt,
      crop_id: record.cropId,
      condition_code: record.conditionCode,
      confidence: record.confidence,
      risk: record.risk,
    })
    .select("id")
    .single();
  if (inserted.error) return { error: inserted.error, saved: null };

  const nextUsed = state.state.allowance.used + 1;
  const allowance: ScanAllowance = {
    kind: "registered",
    limit: REGISTERED_WEEKLY_SCAN_LIMIT,
    used: nextUsed,
    remaining: Math.max(0, REGISTERED_WEEKLY_SCAN_LIMIT - nextUsed),
    resetsAt: reset.toISOString(),
  };
  return { error: null, saved: { record, allowance } };
}

export async function hideRegisteredScan(supabase: SupabaseClient, userId: string, id: string) {
  return supabase
    .from("scan_usage")
    .update({ hidden_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "succeeded");
}

export async function clearRegisteredHistory(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("scan_usage")
    .update({ hidden_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "succeeded")
    .is("hidden_at", null);
}
