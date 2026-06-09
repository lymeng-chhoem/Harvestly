import { COMMUNITY_COMMENT_MAX, cleanBody, isCommunityPermissionError, isDatabaseSetupError, readJsonObject } from "@/lib/community";
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
  console.error(`Community comment ${stage} failed`, error);

  return Response.json({
    error: setupError ? "database_not_configured" : (isCommunityPermissionError(error) ? "permission_denied" : "service"),
    detail: process.env.NODE_ENV === "production" ? undefined : detail,
  }, { status: 502 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const object = readJsonObject(payload);
  if (!object) return Response.json({ error: "invalid_request" }, { status: 400 });

  const body = cleanBody(object.body, COMMUNITY_COMMENT_MAX);
  if (!body) return Response.json({ error: "invalid_body" }, { status: 400 });

  const { data, error } = await supabase
    .from("community_comments")
    .update({ body })
    .eq("id", id)
    .eq("author_id", user.id)
    .is("hidden_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return communityError("update comment", error);
  }
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("community_comments")
    .update({ hidden_at: new Date().toISOString(), hidden_by: user.id })
    .eq("id", id)
    .eq("author_id", user.id)
    .is("hidden_at", null)
    .select("id")
    .maybeSingle();

  if (error) return communityError("delete comment", error);
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({ ok: true });
}
