import {
  COMMUNITY_PHOTO_BUCKET,
  COMMUNITY_PHOTO_MAX_SIZE,
  COMMUNITY_PHOTO_TYPES,
  COMMUNITY_POST_LIMIT,
  COMMUNITY_POST_MAX,
  COMMUNITY_SEARCH_LIMIT,
  buildCommunityFeed,
  cleanBody,
  cleanSearchQuery,
  cleanTopic,
  ensureCommunityProfile,
  hasValidCommunityUsername,
  isCommunityPermissionError,
  isDatabaseSetupError,
  pickUserScanShare,
  photoExtension,
  readJsonObject,
  readPositiveInteger,
  readString,
  scanInsertFields,
  scanOptionsForUser,
} from "@/lib/community";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const COMMUNITY_POST_SELECT = "id, author_id, topic, body, created_at, updated_at, photo_path, photo_width, photo_height, photo_alt, scan_record_id, scan_crop_id, scan_condition_code, scan_confidence, scan_risk, scan_created_at";

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
  console.error(`Community ${stage} failed`, error);

  return Response.json({
    error: setupError ? "database_not_configured" : (isCommunityPermissionError(error) ? "permission_denied" : "service"),
    detail: process.env.NODE_ENV === "production" ? undefined : detail,
  }, { status: 502 });
}

function searchPattern(value: string) {
  return `%${value.replace(/[%_]/g, "\\$&")}%`;
}

function usernameSearchTerm(value: string) {
  return value.replace(/^@/, "").trim();
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const communityProfile = await ensureCommunityProfile(supabase, user);
  if (communityProfile.error) return Response.json({ error: communityProfile.error }, { status: communityProfile.error === "profile_required" ? 403 : 502 });

  const search = cleanSearchQuery(new URL(request.url).searchParams.get("q"));
  let postRows;
  let postsError;

  if (search) {
    const pattern = searchPattern(search);
    const usernamePattern = searchPattern(usernameSearchTerm(search));
    const matchingProfiles = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", usernamePattern)
      .limit(50);

    if (matchingProfiles.error) return communityError("search profiles", matchingProfiles.error);

    const matchingAuthorIds = (matchingProfiles.data ?? []).map((profile) => profile.id);
    const topicMatches = await supabase
      .from("community_posts")
      .select(COMMUNITY_POST_SELECT)
      .is("hidden_at", null)
      .ilike("topic", pattern)
      .order("created_at", { ascending: false })
      .limit(COMMUNITY_SEARCH_LIMIT);
    const bodyMatches = await supabase
      .from("community_posts")
      .select(COMMUNITY_POST_SELECT)
      .is("hidden_at", null)
      .ilike("body", pattern)
      .order("created_at", { ascending: false })
      .limit(COMMUNITY_SEARCH_LIMIT);
    const authorMatches = matchingAuthorIds.length
      ? await supabase
        .from("community_posts")
        .select(COMMUNITY_POST_SELECT)
        .is("hidden_at", null)
        .in("author_id", matchingAuthorIds)
        .order("created_at", { ascending: false })
        .limit(COMMUNITY_SEARCH_LIMIT)
      : { data: [], error: null };

    postsError = topicMatches.error ?? bodyMatches.error ?? authorMatches.error;
    const postMap = new Map<string, NonNullable<typeof topicMatches.data>[number]>();
    for (const post of [...(topicMatches.data ?? []), ...(bodyMatches.data ?? []), ...(authorMatches.data ?? [])]) {
      postMap.set(post.id, post);
    }
    postRows = Array.from(postMap.values())
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, COMMUNITY_SEARCH_LIMIT);
  } else {
    const response = await supabase
      .from("community_posts")
      .select(COMMUNITY_POST_SELECT)
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(COMMUNITY_POST_LIMIT);
    postRows = response.data;
    postsError = response.error;
  }

  if (postsError) return communityError("load posts", postsError);

  const authorIds = new Set<string>((postRows ?? []).map((post) => post.author_id));
  const postAuthorProfiles = authorIds.size
    ? await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", Array.from(authorIds))
    : { data: [], error: null };

  if (postAuthorProfiles.error) return communityError("load post authors", postAuthorProfiles.error);

  const postProfileMap = new Map((postAuthorProfiles.data ?? []).map((profile) => [profile.id, profile]));
  const normalizedSearch = search?.toLocaleLowerCase() ?? null;
  const visiblePostRows = (postRows ?? [])
    .filter((post) => hasValidCommunityUsername(postProfileMap.get(post.author_id)))
    .filter((post) => {
      if (!normalizedSearch) return true;
      const author = postProfileMap.get(post.author_id);
      return [
        post.topic,
        post.body,
        author?.username ? `@${author.username}` : null,
        author?.username,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch));
    })
    .slice(0, COMMUNITY_POST_LIMIT);

  const postIds = visiblePostRows.map((post) => post.id);
  const commentRows = postIds.length
    ? await supabase
      .from("community_comments")
      .select("id, post_id, author_id, body, created_at, updated_at")
      .in("post_id", postIds)
      .is("hidden_at", null)
      .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (commentRows.error) return communityError("load comments", commentRows.error);

  for (const comment of commentRows.data ?? []) authorIds.add(comment.author_id);

  const profileRows = authorIds.size
    ? await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", Array.from(authorIds))
    : { data: [], error: null };

  if (profileRows.error) return communityError("load comment authors", profileRows.error);

  const finalProfileMap = new Map((profileRows.data ?? []).map((profile) => [profile.id, profile]));
  const visibleCommentRows = (commentRows.data ?? [])
    .filter((comment) => hasValidCommunityUsername(finalProfileMap.get(comment.author_id)));

  const reportRows = await supabase
    .from("community_reports")
    .select("target_type, target_id")
    .eq("reporter_id", user.id);

  if (reportRows.error) return communityError("load reports", reportRows.error);

  const photoPaths = visiblePostRows
    .map((post) => post.photo_path)
    .filter((path): path is string => Boolean(path));
  const photoUrls = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signedPhotos, error: photoError } = await supabase
      .storage
      .from(COMMUNITY_PHOTO_BUCKET)
      .createSignedUrls(photoPaths, 60 * 30);
    if (photoError) return communityError("sign photos", photoError);
    for (const photo of signedPhotos ?? []) {
      if (photo.path && photo.signedUrl) photoUrls.set(photo.path, photo.signedUrl);
    }
  }

  return Response.json({
    viewerId: user.id,
    posts: buildCommunityFeed(user.id, visiblePostRows, visibleCommentRows, profileRows.data ?? [], reportRows.data ?? [], photoUrls),
    scanOptions: scanOptionsForUser(user),
    query: search,
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const communityProfile = await ensureCommunityProfile(supabase, user);
  if (communityProfile.error) return Response.json({ error: communityProfile.error }, { status: communityProfile.error === "profile_required" ? 403 : 502 });

  let payload: Record<string, unknown>;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      const json: unknown = await request.json();
      const object = readJsonObject(json);
      if (!object) return Response.json({ error: "invalid_request" }, { status: 400 });
      payload = object;
    }
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const body = cleanBody(payload.body, COMMUNITY_POST_MAX);
  if (!body) return Response.json({ error: "invalid_body" }, { status: 400 });
  const topic = cleanTopic(payload.topic);
  if (payload.topic && typeof payload.topic === "string" && payload.topic.trim() && !topic) {
    return Response.json({ error: "invalid_topic" }, { status: 400 });
  }

  const scanRecordId = readString(payload.scanRecordId);
  const { scan, error: scanError } = pickUserScanShare(user, scanRecordId);
  if (scanError) return Response.json({ error: scanError }, { status: 400 });

  const photo = payload.photo;
  let photoFields = {
    photo_path: null as string | null,
    photo_width: null as number | null,
    photo_height: null as number | null,
    photo_alt: null as string | null,
  };
  if (photo instanceof File && photo.size > 0) {
    if (!COMMUNITY_PHOTO_TYPES.has(photo.type)) return Response.json({ error: "invalid_photo_type" }, { status: 415 });
    if (photo.size > COMMUNITY_PHOTO_MAX_SIZE) return Response.json({ error: "invalid_photo_size" }, { status: 413 });
    const extension = photoExtension(photo.type);
    if (!extension) return Response.json({ error: "invalid_photo_type" }, { status: 415 });
    const photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase
      .storage
      .from(COMMUNITY_PHOTO_BUCKET)
      .upload(photoPath, photo, {
        cacheControl: "3600",
        contentType: photo.type,
        upsert: false,
      });
    if (uploadError) {
      const uploadMessage = uploadError.message?.toLowerCase() ?? "";
      const uploadStatus = "statusCode" in uploadError ? String(uploadError.statusCode) : "";
      const errorCode = uploadMessage.includes("bucket") || uploadStatus === "404"
        ? "photo_storage_not_configured"
        : "photo_upload_failed";
      return Response.json({ error: errorCode }, { status: 502 });
    }
    photoFields = {
      photo_path: photoPath,
      photo_width: readPositiveInteger(payload.photoWidth),
      photo_height: readPositiveInteger(payload.photoHeight),
      photo_alt: cleanTopic(payload.photoAlt)?.slice(0, 80) ?? topic ?? null,
    };
  }

  const { error } = await supabase
    .from("community_posts")
    .insert({
      author_id: user.id,
      topic,
      body,
      ...photoFields,
      ...scanInsertFields(scan),
    });

  if (error) {
    if (photoFields.photo_path) {
      await supabase.storage.from(COMMUNITY_PHOTO_BUCKET).remove([photoFields.photo_path]);
    }
    return communityError("insert post", error);
  }

  return Response.json({ ok: true });
}
