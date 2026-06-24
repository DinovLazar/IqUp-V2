"use client";

/**
 * Browser-side Supabase Auth client for the admin panel (Phase 2.04).
 *
 * Cookie-based, built on `@supabase/ssr` so the session it writes is readable by
 * the server (middleware + `requireAdmin()`). It uses ONLY the PUBLIC keys
 * (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — the anon key is
 * safe in the browser; RLS + the `requireAdmin()` allowlist are the real
 * security boundary. This is kept SEPARATE from the service-role client in
 * `src/lib/supabase/server.ts` (which must never reach the browser).
 *
 * Used only by the `/admin/login` flow (password sign-in + TOTP enrol/challenge)
 * and the sign-out button.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createAdminBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase auth client is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, anonKey);
}
