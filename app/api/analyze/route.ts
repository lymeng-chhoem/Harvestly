import { addRegisteredScan, registeredScanState } from "@/lib/account-scan-state";
import { createStoredScanRecord, isModelAnalysisResponse } from "@/lib/harvestly-content";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MODEL_TIMEOUT_MS = 20_000;

export const runtime = "nodejs";

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

  const { supabase, user } = await getAuthenticatedUser();

  if (user) {
    const allowance = registeredScanState(user).allowance;
    if (allowance.remaining === 0) {
      return Response.json({ error: "limit", allowance }, { status: 429 });
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
      return Response.json({ error: "service" }, { status: 502 });
    }

    const analysis: unknown = await modelResponse.json();
    if (!isModelAnalysisResponse(analysis)) {
      return Response.json({ error: "invalid_response" }, { status: 502 });
    }

    if (supabase && user) {
      const saved = addRegisteredScan(user, analysis);
      const { error } = await supabase.auth.updateUser({ data: saved.metadata });
      if (error) return Response.json({ error: "service" }, { status: 502 });
      return Response.json({
        record: saved.record,
        allowance: saved.allowance,
      });
    }

    return Response.json({ record: createStoredScanRecord(analysis) });
  } catch (error) {
    const code = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network";
    return Response.json({ error: code }, { status: 502 });
  }
}
