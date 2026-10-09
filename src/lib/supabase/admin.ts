import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server-only jobs and administrative data
 * operations. Never import this module into a Client Component or expose its
 * key in NEXT_PUBLIC_* variables. Route handlers must authorize the caller
 * before using this client.
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and server-only SUPABASE_SECRET_KEY.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
