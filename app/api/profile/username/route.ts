import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type ClaimUsernameRow = {
  username?: unknown;
};

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
    return Response.json({ error: "service" }, { status: 502 });
  }

  const claimed = Array.isArray(data)
    ? (data[0] as ClaimUsernameRow | undefined)?.username
    : null;

  return Response.json({ username: typeof claimed === "string" ? claimed : username });
}
