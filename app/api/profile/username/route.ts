import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type ClaimUsernameRow = {
  username?: unknown;
};

const DATABASE_SETUP_ERROR_CODES = new Set([
  "PGRST202",
  "PGRST204",
  "PGRST205",
  "42P01",
  "42703",
  "42883",
]);

function isDatabaseSetupError(error: { code?: string; message?: string }) {
  if (error.code && DATABASE_SETUP_ERROR_CODES.has(error.code)) return true;

  const message = error.message?.toLowerCase() ?? "";
  return message.includes("claim_harvestly_username")
    || message.includes("public.profiles")
    || message.includes("profiles");
}

async function saveUsernameToUserMetadata(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["supabase"]>,
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]>,
  username: string,
) {
  const { error } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      harvestly_username: username,
    },
  });

  return error;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const rawUsername = payload && typeof payload === "object" && "username" in payload
    ? (payload as { username?: unknown }).username
    : null;
  if (typeof rawUsername !== "string") {
    return Response.json({ error: "invalid_username" }, { status: 400 });
  }

  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) {
    return Response.json({ error: "invalid_username" }, { status: 400 });
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.rpc("claim_harvestly_username", { p_username: username });
  if (error) {
    if (error.code === "23505") return Response.json({ error: "username_taken" }, { status: 409 });
    if (error.code === "22023") return Response.json({ error: "invalid_username" }, { status: 400 });
    if (error.code === "42501") return Response.json({ error: "unauthorized" }, { status: 401 });
    if (isDatabaseSetupError(error)) {
      const metadataError = await saveUsernameToUserMetadata(supabase, user, username);
      return metadataError
        ? Response.json({ error: "database_not_configured" }, { status: 503 })
        : Response.json({ username, source: "metadata" });
    }
    return Response.json({ error: "service" }, { status: 502 });
  }

  const claimed = Array.isArray(data)
    ? (data[0] as ClaimUsernameRow | undefined)?.username
    : null;

  return Response.json({ username: typeof claimed === "string" ? claimed : username });
}
