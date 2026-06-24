import "server-only";

/**
 * Server-side Supabase Auth client for the admin panel (Phase 2.04).
 *
 * Cookie-based (`@supabase/ssr`) so it reads the session the browser client
 * wrote and the middleware refreshed. It uses ONLY the PUBLIC keys
 * (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`); it is the
 * session/identity client (`auth.getUser()`, MFA assurance level), NOT a data
 * client. RLS + the `requireAdmin()` allowlist are the security boundary.
 *
 * Kept SEPARATE from the service-role client (`src/lib/supabase/server.ts`),
 * which bypasses RLS and is used only for the allowlist read + the stats RPC.
 *
 * `cookies()` is async in the App Router; the `setAll` writes are wrapped so a
 * call from a Server Component (where cookies are read-only) is a no-op — the
 * middleware is what actually refreshes the session cookie on each request.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAdminServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase auth client is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (read-only cookies). Safe to ignore:
          // `src/middleware.ts` refreshes the session cookie on every request.
        }
      },
    },
  });
}
