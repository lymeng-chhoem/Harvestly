import { COMMUNITY_POST_MAX, cleanBody, cleanTopic, isCommunityPermissionError, isDatabaseSetupError, readJsonObject } from "@/lib/community";
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
  console.error(`Community post ${stage} failed`, error);

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

  const body = cleanBody(object.body, COMMUNITY_POST_MAX);
  if (!body) return Response.json({ error: "invalid_body" }, { status: 400 });
  const topic = cleanTopic(object.topic);
  if (object.topic && typeof object.topic === "string" && object.topic.trim() && !topic) {
    return Response.json({ error: "invalid_topic" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("community_posts")
    .update({ body, topic })
    .eq("id", id)
    .eq("author_id", user.id)
    .is("hidden_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return communityError("update post", error);
  }
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("delete_community_post", { p_post_id: id });

  if (error) return communityError("delete post", error);
  if (!data) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({ ok: true });
}
