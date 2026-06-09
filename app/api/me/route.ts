import { readDatabaseAccountProfile } from "@/lib/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return Response.json({ error: "service" }, { status: 502 });

  const profile = readDatabaseAccountProfile(data);
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
    profile,
  });
}
