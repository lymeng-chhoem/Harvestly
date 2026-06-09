import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

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
  return message.includes("public.profiles")
    || message.includes("profiles");
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

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      username,
      updated_at: new Date().toISOString(),
    })
    .select("username")
    .single();
  if (error) {
    if (error.code === "23505") return Response.json({ error: "username_taken" }, { status: 409 });
    if (error.code === "22023") return Response.json({ error: "invalid_username" }, { status: 400 });
    if (isDatabaseSetupError(error)) {
      return Response.json({ error: "database_not_configured" }, { status: 503 });
    }
    return Response.json({ error: "service" }, { status: 502 });
  }

  return Response.json({ username: typeof data?.username === "string" ? data.username : username });
}
