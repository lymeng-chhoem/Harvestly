"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

let client: SupabaseClient | null | undefined;

export function createSupabaseBrowserClient() {
  if (client !== undefined) return client;

  const config = getPublicSupabaseConfig();
  client = config ? createBrowserClient(config.url, config.publishableKey) : null;
  return client;
}
