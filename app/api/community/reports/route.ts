import { cleanReportReason, isCommunityPermissionError, isDatabaseSetupError, readJsonObject, readString, type CommunityTargetType } from "@/lib/community";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function communityError(stage: string, error: SupabaseLikeError) {
  const setupError = isDatabaseSetupError(error);
  const detail = [stage, error.code, error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" | ");
  console.error(`Community report ${stage} failed`, error);

  return Response.json({
    error: setupError ? "database_not_configured" : (isCommunityPermissionError(error) ? "permission_denied" : "service"),
    detail: process.env.NODE_ENV === "production" ? undefined : detail,
  }, { status: 502 });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const object = readJsonObject(payload);
  const targetType = object?.targetType === "post" || object?.targetType === "comment"
    ? object.targetType as CommunityTargetType
    : null;
  const targetId = readString(object?.targetId);
  const reason = cleanReportReason(object?.reason);

  if (!targetType || !targetId) return Response.json({ error: "invalid_target" }, { status: 400 });
  if (object?.reason != null && typeof object.reason === "string" && object.reason.trim().length > 300) {
    return Response.json({ error: "invalid_reason" }, { status: 400 });
  }

  const target = targetType === "post"
    ? await supabase.from("community_posts").select("id").eq("id", targetId).is("hidden_at", null).maybeSingle()
    : await supabase.from("community_comments").select("id").eq("id", targetId).is("hidden_at", null).maybeSingle();

  if (target.error) {
    return communityError("load target", target.error);
  }
  if (!target.data) return Response.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("community_reports")
    .upsert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    }, {
      onConflict: "reporter_id,target_type,target_id",
      ignoreDuplicates: true,
    });

  if (error) {
    return communityError("insert report", error);
  }

  return Response.json({ ok: true });
}
