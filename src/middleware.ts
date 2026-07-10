/**
 * Composed middleware (Phase 2.04 admin session + Feat-Serbian-Localization i18n).
 *
 * The app has two concerns handled here, branched by pathname:
 *
 *  1. `/admin/**` — REFRESH the Supabase Auth session cookie (so server components
 *     see a live session) and bounce obviously unauthenticated requests to
 *     `/admin/login`. This is intentionally LIGHT — NOT the security boundary
 *     (that is `requireAdmin()`, which checks aal2 + the allowlist). Admin is
 *     Macedonian-only, so it gets NO locale routing.
 *
 *  2. Everything else public (`/`, `/procena`, `/za-testot`, …, and the `/sr`
 *     variants) — the next-intl middleware, which serves Macedonian at the root and
 *     Serbian under `/sr` (`localePrefix: "as-needed"`) and sets `<html lang>` +
 *     the `NEXT_LOCALE` cookie.
 *
 *  `/kit` + `/embed` are dev/reserved and NOT localized, so they pass straight
 *  through with no locale rewrite.
 *
 * Both branches are edge-safe: the admin branch uses only the public anon key; the
 * intl branch is pure routing. `/api`, `/_next`, `/_vercel` and static files are
 * excluded by the matcher. (The file stays `middleware.ts` — the Next 16.2
 * `middleware`→`proxy` rename is the separate, still-open D-128 follow-up.)
 */

import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/** `/admin/**` session refresh + unauthenticated redirect (Phase 2.04, unchanged). */
async function handleAdmin(request: NextRequest): Promise<NextResponse> {
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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Admin session (Macedonian-only tool; no locale routing).
  if (pathname.startsWith("/admin")) {
    return handleAdmin(request);
  }

  // Dev/reserved, unlocalized — no locale prefix, no rewrite.
  if (
    pathname === "/kit" ||
    pathname.startsWith("/kit/") ||
    pathname === "/embed" ||
    pathname.startsWith("/embed/")
  ) {
    return NextResponse.next();
  }

  // Everything else public → next-intl (MK at root, SR under /sr).
  return handleI18nRouting(request);
}

export const config = {
  // Run on all paths EXCEPT API routes, Next internals, and static files (any
  // path containing a dot, e.g. favicon.ico / icon.svg). Both the `/admin/**`
  // session refresh and the public i18n routing are dispatched inside `middleware`.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
