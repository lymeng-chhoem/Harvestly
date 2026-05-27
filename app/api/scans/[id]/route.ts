import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();
  if (!supabase || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("scan_usage")
    .update({ hidden_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "succeeded");

  if (error) return Response.json({ error: "service" }, { status: 502 });
  return Response.json({ ok: true });
}
