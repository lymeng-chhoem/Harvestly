import { createStoredScanRecord, type ModelAnalysisResponse } from "@/lib/harvestly-content";
import { REGISTERED_WEEKLY_SCAN_LIMIT, type ScanAllowance } from "@/lib/scan-usage";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

function registeredAllowance(row?: { used: number; remaining: number; resets_at: string } | null): ScanAllowance {
  return {
    kind: "registered",
    limit: REGISTERED_WEEKLY_SCAN_LIMIT,
    used: row?.used ?? 0,
    remaining: row?.remaining ?? REGISTERED_WEEKLY_SCAN_LIMIT,
    resetsAt: row?.resets_at,
  };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return Response.json({ error: "configuration" }, { status: 503 });

  const { data: rows, error } = await supabase
    .from("scan_usage")
    .select("id, completed_at, crop_id, condition_code, confidence, risk")
    .eq("status", "succeeded")
    .is("hidden_at", null)
    .order("completed_at", { ascending: false })
    .limit(30);

  const { data: allowanceRows, error: allowanceError } = await admin.rpc("get_scan_allowance", { p_user_id: user.id });
  if (error || allowanceError) return Response.json({ error: "service" }, { status: 502 });

  const records = (rows ?? []).map((row) => {
    const stored = row as unknown as {
      id: string;
      completed_at: string;
      crop_id: ModelAnalysisResponse["cropId"];
      condition_code: string;
      confidence: number;
      risk: ModelAnalysisResponse["risk"];
    };
    return createStoredScanRecord(
      {
        cropId: stored.crop_id,
        conditionCode: stored.condition_code,
        confidence: stored.confidence,
        risk: stored.risk,
      },
      { id: stored.id, createdAt: stored.completed_at },
    );
  });

  return Response.json({ records, allowance: registeredAllowance(allowanceRows?.[0]) });
}

export async function DELETE() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("scan_usage")
    .update({ hidden_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "succeeded");

  if (error) return Response.json({ error: "service" }, { status: 502 });
  return Response.json({ ok: true });
}
