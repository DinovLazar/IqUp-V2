import "server-only";

/**
 * requireAdmin() — the real server-side security boundary for the admin panel
 * (Phase 2.04, resolved decision 4). `src/middleware.ts` refreshes the session
 * and bounces obviously-unauthenticated requests, but it is NOT the boundary:
 * EVERY admin page and the export route calls this, which enforces all three
 * conditions before any data is read:
 *
 *   1. a valid session (`auth.getUser()` returns a user);
 *   2. assurance level aal2 — TOTP MFA satisfied (aal1 = not satisfied, denied);
 *   3. the user_id is present in the `public.admin_users` allowlist (read via the
 *      service-role client — a POSITIVE check, so the panel stays shut even if
 *      Supabase sign-ups are ever re-enabled).
 *
 * The decision logic is the pure `evaluateAdmin()` (unit-tested across the
 * deny/allow matrix); `requireAdmin()` only wires the live clients to it. There
 * is no roles/permissions model yet — this single function is the extension
 * point for one (resolved decision 4).
 */

import { redirect } from "next/navigation";

import { createAdminServerClient } from "./admin-server";
import { getServiceRoleClient } from "./server";

/** Why a request is not an admin (drives redirect-vs-401 at the call site). */
export type AdminAuthFailure =
  | "unauthenticated"
  | "mfa_required"
  | "not_allowlisted";

export type AdminAuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; reason: AdminAuthFailure };

export interface AdminAuthInput {
  hasUser: boolean;
  userId?: string;
  email?: string | null;
  /** From `auth.mfa.getAuthenticatorAssuranceLevel()` — we REQUIRE "aal2". */
  currentLevel: string | null;
  /** Is `userId` present in public.admin_users? */
  isAllowlisted: boolean;
}

/**
 * Pure admin decision. Order matters: session → MFA → allowlist, so the failure
 * reason is the most actionable one (e.g. an authenticated-but-aal1 user is told
 * to finish MFA, not that they are not an admin).
 */
export function evaluateAdmin(input: AdminAuthInput): AdminAuthResult {
  if (!input.hasUser || !input.userId) {
    return { ok: false, reason: "unauthenticated" };
  }
  if (input.currentLevel !== "aal2") {
    return { ok: false, reason: "mfa_required" };
  }
  if (!input.isAllowlisted) {
    return { ok: false, reason: "not_allowlisted" };
  }
  return { ok: true, userId: input.userId, email: input.email ?? null };
}

/** Allowlist read via the service-role client (bypasses RLS; server-only). */
async function isUserAllowlisted(userId: string): Promise<boolean> {
  const service = getServiceRoleClient();
  const { data, error } = await service
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // Fail-closed (deny), but log PII-free so a real outage (e.g. rotated
    // service-role key) is diagnosable and not silently read as "not an admin".
    console.error(`[admin-guard] allowlist read failed: ${error.code}`);
  }
  return !error && !!data;
}

/**
 * The boundary. Returns a discriminated result so the caller chooses the
 * response: pages redirect to /admin/login, API routes return 401 (see
 * `requireAdminPage()` / the export route).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createAdminServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return evaluateAdmin({
      hasUser: false,
      currentLevel: null,
      isAllowlisted: false,
    });
  }

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = aal?.currentLevel ?? null;

  const isAllowlisted = await isUserAllowlisted(user.id);

  return evaluateAdmin({
    hasUser: true,
    userId: user.id,
    email: user.email ?? null,
    currentLevel,
    isAllowlisted,
  });
}

/**
 * Page convenience over `requireAdmin()`: on any failure, redirect to
 * /admin/login (so an aal1 / non-allowlisted session lands on the login screen
 * to complete MFA or get denied) and otherwise return the narrowed-ok result.
 * Every admin PAGE calls this; the export ROUTE calls `requireAdmin()` directly
 * so it can return a 401 instead of redirecting.
 */
export async function requireAdminPage(): Promise<
  Extract<AdminAuthResult, { ok: true }>
> {
  const result = await requireAdmin();
  if (!result.ok) redirect("/admin/login");
  return result;
}
