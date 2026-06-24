/**
 * Server-only Supabase client (service role).
 *
 * The service-role key bypasses RLS, so this module MUST never reach the browser.
 * Two guards enforce that:
 *   1. `import "server-only"` — turns any client-component import into a build
 *      error.
 *   2. The key is read from `SUPABASE_SERVICE_ROLE_KEY`, which is NOT prefixed
 *      `NEXT_PUBLIC_`, so Next never inlines it into client bundles.
 *
 * The browser never talks to Supabase directly — it POSTs to `/api/score`, which
 * is the only caller of this client.
 */

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Build (once) the service-role client from env. Throws a NON-secret error if the
 * config is missing — the message never contains the key or URL.
 */
export function getServiceRoleClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      // A server-side, no-session client: never persist or refresh tokens.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
