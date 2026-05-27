import { createStoredScanRecord, isModelAnalysisResponse } from "@/lib/harvestly-content";
import { REGISTERED_WEEKLY_SCAN_LIMIT, type ScanAllowance } from "@/lib/scan-usage";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MODEL_TIMEOUT_MS = 20_000;

export const runtime = "nodejs";

function allowanceFromRow(row: { used: number; remaining: number; resets_at: string }): ScanAllowance {
  return {
    kind: "registered",
    limit: REGISTERED_WEEKLY_SCAN_LIMIT,
    used: row.used,
    remaining: row.remaining,
    resetsAt: row.resets_at,
  };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json({ error: "missing_image" }, { status: 400 });
  }
  if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
    return Response.json({ error: "invalid_type" }, { status: 415 });
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return Response.json({ error: "invalid_size" }, { status: 413 });
  }

  const endpoint = process.env.HARVESTLY_MODEL_ENDPOINT;
  if (!endpoint) {
    return Response.json({ error: "configuration" }, { status: 503 });
  }

  const { user } = await getAuthenticatedUser();
  const admin = user ? createSupabaseAdminClient() : null;
  let reservationId: string | null = null;

  if (user) {
    if (!admin) return Response.json({ error: "configuration" }, { status: 503 });
    const { data: reservations, error } = await admin.rpc("reserve_scan_slot", { p_user_id: user.id });
    if (error || !reservations?.[0]) return Response.json({ error: "service" }, { status: 502 });
    const reservation = reservations[0] as { reservation_id: string | null; used: number; remaining: number; resets_at: string };
    if (!reservation.reservation_id) {
      return Response.json({ error: "limit", allowance: allowanceFromRow(reservation) }, { status: 429 });
    }
    reservationId = reservation.reservation_id;
  }

  async function releaseReservation() {
    if (admin && user && reservationId) {
      await admin.rpc("release_scan_slot", { p_user_id: user.id, p_reservation_id: reservationId });
    }
  }

  const forwardedImage = new FormData();
  forwardedImage.append("image", image, image.name);
  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = process.env.HARVESTLY_MODEL_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const modelResponse = await fetch(endpoint, {
      method: "POST",
      body: forwardedImage,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    if (!modelResponse.ok) {
      await releaseReservation();
      return Response.json({ error: "service" }, { status: 502 });
    }

    const analysis: unknown = await modelResponse.json();
    if (!isModelAnalysisResponse(analysis)) {
      await releaseReservation();
      return Response.json({ error: "invalid_response" }, { status: 502 });
    }

    if (admin && user && reservationId) {
      const { data: completed, error } = await admin.rpc("complete_scan_slot", {
        p_user_id: user.id,
        p_reservation_id: reservationId,
        p_crop_id: analysis.cropId,
        p_condition_code: analysis.conditionCode,
        p_confidence: analysis.confidence,
        p_risk: analysis.risk,
      });
      if (error || !completed?.[0]) {
        await releaseReservation();
        return Response.json({ error: "service" }, { status: 502 });
      }
      const saved = completed[0] as { completed_id: string; created_at: string; used: number; remaining: number; resets_at: string };
      return Response.json({
        record: createStoredScanRecord(analysis, { id: saved.completed_id, createdAt: saved.created_at }),
        allowance: allowanceFromRow(saved),
      });
    }

    return Response.json({ record: createStoredScanRecord(analysis) });
  } catch (error) {
    await releaseReservation();
    const code = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network";
    return Response.json({ error: code }, { status: 502 });
  }
}
