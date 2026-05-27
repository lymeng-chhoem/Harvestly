"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;

  const config = getPublicSupabaseConfig();
  if (!config) return null;

  client = createBrowserClient(config.url, config.anonKey);
  return client;
}
