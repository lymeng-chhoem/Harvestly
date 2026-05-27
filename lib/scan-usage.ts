import type { StoredScanRecord } from "@/lib/harvestly-content";

export const ANONYMOUS_SCAN_LIMIT = 1;
export const REGISTERED_WEEKLY_SCAN_LIMIT = 5;
export const ANONYMOUS_USAGE_STORAGE_KEY = "harvestly-anonymous-scan-usage:v1";

export type ScanAllowance = {
  kind: "anonymous" | "registered";
  limit: number;
  used: number;
  remaining: number;
  resetsAt?: string;
};

export type AnalyzeSuccessResponse = {
  record: StoredScanRecord;
  allowance?: ScanAllowance;
};

export type AuthenticatedScanState = {
  records: StoredScanRecord[];
  allowance: ScanAllowance;
};

export function readAnonymousAllowance(): ScanAllowance {
  let used = 0;
  try {
    used = window.localStorage.getItem(ANONYMOUS_USAGE_STORAGE_KEY) === "used" ? 1 : 0;
  } catch {
    used = 0;
  }
  return {
    kind: "anonymous",
    limit: ANONYMOUS_SCAN_LIMIT,
    used,
    remaining: Math.max(0, ANONYMOUS_SCAN_LIMIT - used),
  };
}

export function spendAnonymousScan(): ScanAllowance {
  try {
    window.localStorage.setItem(ANONYMOUS_USAGE_STORAGE_KEY, "used");
  } catch {
    // A blocked storage write should not hide a completed diagnosis.
  }
  return readAnonymousAllowance();
}
