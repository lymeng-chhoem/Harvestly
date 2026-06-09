import {
  PROFILE_AVATAR_BUCKET,
  PROFILE_AVATAR_MAX_SIZE,
  PROFILE_AVATAR_TYPES,
  profileAvatarExtension,
  isValidUsername,
  normalizeUsername,
} from "@/lib/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type ProfileAvatarRow = {
  username?: unknown;
  avatar_path?: unknown;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  statusCode?: string | number;
};

const DATABASE_SETUP_ERROR_CODES = new Set(["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"]);

function isSetupError(error: SupabaseLikeError) {
  if (error.code && DATABASE_SETUP_ERROR_CODES.has(error.code)) return true;
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("row-level security")
    || message.includes("permission denied")
    || message.includes("not authorized")
    || message.includes("unauthorized")) {
    return false;
  }
  const mentionsProfileSchema = message.includes(PROFILE_AVATAR_BUCKET)
    || message.includes("avatar_path")
    || message.includes("profiles");
  const looksLikeMissingSchema = message.includes("bucket")
    || message.includes("does not exist")
    || message.includes("could not find")
    || message.includes("schema cache")
    || message.includes("column")
    || message.includes("relation");
  return mentionsProfileSchema && looksLikeMissingSchema;
}

function isStorageSetupError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";
  const statusCode = error.statusCode == null ? "" : String(error.statusCode);
  return statusCode === "404" || message.includes("bucket") || message.includes(PROFILE_AVATAR_BUCKET);
}

function safeAvatarPath(path: unknown, userId: string) {
  return typeof path === "string" && path.startsWith(`${userId}/`) ? path : null;
}

async function loadExistingAvatarPath(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"]>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_path")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { path: null, error };
  const row = data as ProfileAvatarRow | null;
  const rowUsername = typeof row?.username === "string" ? normalizeUsername(row.username) : null;
  return {
    path: safeAvatarPath(row?.avatar_path, userId),
    username: rowUsername && isValidUsername(rowUsername) ? rowUsername : null,
    error: null,
  };
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!PROFILE_AVATAR_TYPES.has(avatar.type)) {
    return Response.json({ error: "invalid_photo_type" }, { status: 415 });
  }
  if (avatar.size > PROFILE_AVATAR_MAX_SIZE) {
    return Response.json({ error: "invalid_photo_size" }, { status: 413 });
  }

  const extension = profileAvatarExtension(avatar.type);
  if (!extension) return Response.json({ error: "invalid_photo_type" }, { status: 415 });

  const existing = await loadExistingAvatarPath(supabase, user.id);
  if (existing.error && isSetupError(existing.error)) {
    return Response.json({ error: "avatar_storage_not_configured" }, { status: 503 });
  }
  if (existing.error) return Response.json({ error: "service" }, { status: 502 });

  const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase
    .storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(avatarPath, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json({
      error: isStorageSetupError(uploadError) ? "avatar_storage_not_configured" : "service",
    }, { status: isStorageSetupError(uploadError) ? 503 : 502 });
  }

  const avatarUrl = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(avatarPath).data.publicUrl;
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      username: existing.username,
      avatar_url: avatarUrl,
      avatar_path: avatarPath,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([avatarPath]);
    return Response.json({
      error: isSetupError(profileError) ? "avatar_storage_not_configured" : "service",
    }, { status: isSetupError(profileError) ? 503 : 502 });
  }

  if (existing.path) {
    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([existing.path]);
  }

  return Response.json({ avatarUrl });
}

export async function DELETE() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const existing = await loadExistingAvatarPath(supabase, user.id);
  if (existing.error && isSetupError(existing.error)) {
    return Response.json({ error: "avatar_storage_not_configured" }, { status: 503 });
  }
  if (existing.error) return Response.json({ error: "service" }, { status: 502 });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      avatar_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return Response.json({
      error: isSetupError(profileError) ? "avatar_storage_not_configured" : "service",
    }, { status: isSetupError(profileError) ? 503 : 502 });
  }

  if (existing.path) {
    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([existing.path]);
  }

  return Response.json({ ok: true });
}
