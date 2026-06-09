import { clearRegisteredHistory, registeredScanState } from "@/lib/account-scan-state";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { error, state } = await registeredScanState(supabase, user.id);
  if (error || !state) return Response.json({ error: "service" }, { status: 502 });
  return Response.json(state);
}

export async function DELETE() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await clearRegisteredHistory(supabase, user.id);

  if (error) return Response.json({ error: "service" }, { status: 502 });
  return Response.json({ ok: true });
}
