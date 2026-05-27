import { clearRegisteredHistory, registeredScanState } from "@/lib/account-scan-state";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  return Response.json(registeredScanState(user));
}

export async function DELETE() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.auth.updateUser({ data: clearRegisteredHistory() });

  if (error) return Response.json({ error: "service" }, { status: 502 });
  return Response.json({ ok: true });
}
