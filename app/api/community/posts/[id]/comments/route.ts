import { COMMUNITY_COMMENT_MAX, cleanBody, ensureCommunityProfile, isCommunityPermissionError, isDatabaseSetupError, readJsonObject } from "@/lib/community";
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
  console.error(`Community comment create ${stage} failed`, error);

  return Response.json({
    error: setupError ? "database_not_configured" : (isCommunityPermissionError(error) ? "permission_denied" : "service"),
    detail: process.env.NODE_ENV === "production" ? undefined : detail,
  }, { status: 502 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const communityProfile = await ensureCommunityProfile(supabase, user);
  if (communityProfile.error) return Response.json({ error: communityProfile.error }, { status: communityProfile.error === "profile_required" ? 403 : 502 });

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

  const { data: post, error: postError } = await supabase
    .from("community_posts")
    .select("id")
    .eq("id", id)
    .is("hidden_at", null)
    .maybeSingle();

  if (postError) {
    return communityError("load post", postError);
  }
  if (!post) return Response.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("community_comments")
    .insert({ post_id: id, author_id: user.id, body });

  if (error) {
    return communityError("insert comment", error);
  }

  return Response.json({ ok: true });
}
