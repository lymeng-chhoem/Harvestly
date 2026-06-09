import { getAuthenticatedUser } from "@/lib/supabase/server";
import { CommunityContent } from "../_components/community/CommunityContent";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const { user } = await getAuthenticatedUser();
  return <CommunityContent authenticated={Boolean(user)} />;
}
