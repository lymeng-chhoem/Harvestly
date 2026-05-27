import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig, getServiceRoleKey } from "./config";

export async function createSupabaseServerClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy handles session refreshes.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = getServiceRoleKey();
  if (!config || !serviceRoleKey) return null;

  return createClient(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };

  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}
