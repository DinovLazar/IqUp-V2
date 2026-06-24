/**
 * Admin session middleware (Phase 2.04).
 *
 * Runs on every `/admin/**` request to (1) REFRESH the Supabase Auth session
 * cookie (so server components see a live session) and (2) bounce obviously
 * unauthenticated requests to `/admin/login`. It is intentionally LIGHT — it is
 * NOT the security boundary: it only checks that a user exists, never aal2 or the
 * allowlist. The real boundary is `requireAdmin()`, which every admin page and
 * the export route calls (so a session that is authenticated but not aal2 / not
 * allowlisted still reaches no data). `/admin/login` is excluded to avoid a loop.
 *
 * Built on `@supabase/ssr` with request/response cookie bridging, using only the
 * public anon key (edge-safe; the service-role client never runs here).
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Misconfigured env: fail SAFE for protected routes (send to login), never
  // silently let a request through to a page that expects a session.
  if (!url || !anonKey) {
    if (request.nextUrl.pathname !== "/admin/login") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: keep getUser() immediately after client creation — it refreshes
  // the session. Do not insert logic between the two (Supabase ssr guidance).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Let the login page through (it must be reachable without a session).
  if (request.nextUrl.pathname === "/admin/login") {
    return supabaseResponse;
  }

  // No session → send to login. aal2 + allowlist are enforced by requireAdmin().
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  // All admin routes (`/admin` and everything under it). `/admin/login` is
  // handled inside the middleware so it is reachable, avoiding a redirect loop.
  matcher: ["/admin/:path*"],
};
