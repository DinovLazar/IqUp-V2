/**
 * requireAdmin() / evaluateAdmin() — the admin security boundary (Phase 2.04).
 * `server-only` is neutralized; the SSR auth client, the service-role client, and
 * `next/navigation` are mocked so the deny/allow matrix is exercised without a
 * live Supabase or a browser.
 *
 * Asserts the boundary denies: no session, aal1-only (MFA not satisfied), and
 * authenticated-but-not-allowlisted — and allows a valid aal2 allowlisted user.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mutable state the mocks read (reset per test).
let mockUser: { id: string; email?: string } | null = null;
let mockLevel: string | null = null;
let mockAllowlistRow: { user_id: string } | null = null;
let mockAllowlistError: { code: string } | null = null;

// Hoisted so it exists when the (hoisted) next/navigation mock factory runs.
const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/admin-server", () => ({
  createAdminServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: mockLevel, nextLevel: mockLevel },
        }),
      },
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: mockAllowlistRow,
            error: mockAllowlistError,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { evaluateAdmin, requireAdmin, requireAdminPage } from "../admin-guard";

beforeEach(() => {
  mockUser = null;
  mockLevel = null;
  mockAllowlistRow = null;
  mockAllowlistError = null;
  redirectMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("evaluateAdmin (pure decision)", () => {
  it("denies with no session", () => {
    expect(
      evaluateAdmin({
        hasUser: false,
        currentLevel: null,
        isAllowlisted: false,
      }),
    ).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("denies an aal1-only (MFA-not-satisfied) session", () => {
    expect(
      evaluateAdmin({
        hasUser: true,
        userId: "u1",
        currentLevel: "aal1",
        isAllowlisted: true,
      }),
    ).toEqual({ ok: false, reason: "mfa_required" });
  });

  it("denies an aal2 session that is not on the allowlist", () => {
    expect(
      evaluateAdmin({
        hasUser: true,
        userId: "u1",
        currentLevel: "aal2",
        isAllowlisted: false,
      }),
    ).toEqual({ ok: false, reason: "not_allowlisted" });
  });

  it("allows a valid aal2 allowlisted user", () => {
    expect(
      evaluateAdmin({
        hasUser: true,
        userId: "u1",
        email: "a@b.co",
        currentLevel: "aal2",
        isAllowlisted: true,
      }),
    ).toEqual({ ok: true, userId: "u1", email: "a@b.co" });
  });
});

describe("requireAdmin (wired)", () => {
  it("unauthenticated → not ok", async () => {
    mockUser = null;
    expect(await requireAdmin()).toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("authenticated but aal1 → mfa_required", async () => {
    mockUser = { id: "u1", email: "a@b.co" };
    mockLevel = "aal1";
    mockAllowlistRow = { user_id: "u1" };
    expect(await requireAdmin()).toEqual({
      ok: false,
      reason: "mfa_required",
    });
  });

  it("aal2 but not allowlisted → not_allowlisted", async () => {
    mockUser = { id: "u1", email: "a@b.co" };
    mockLevel = "aal2";
    mockAllowlistRow = null;
    expect(await requireAdmin()).toEqual({
      ok: false,
      reason: "not_allowlisted",
    });
  });

  it("aal2 + allowlisted → ok with the user", async () => {
    mockUser = { id: "u1", email: "a@b.co" };
    mockLevel = "aal2";
    mockAllowlistRow = { user_id: "u1" };
    expect(await requireAdmin()).toEqual({
      ok: true,
      userId: "u1",
      email: "a@b.co",
    });
  });

  it("treats an allowlist read error as NOT allowlisted (fail-closed)", async () => {
    mockUser = { id: "u1", email: "a@b.co" };
    mockLevel = "aal2";
    mockAllowlistRow = null;
    mockAllowlistError = { code: "boom" };
    expect(await requireAdmin()).toEqual({
      ok: false,
      reason: "not_allowlisted",
    });
  });
});

describe("requireAdminPage (redirect on failure)", () => {
  it("redirects to /admin/login when not an admin", async () => {
    mockUser = null;
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("returns the ok result for a valid admin (no redirect)", async () => {
    mockUser = { id: "u1", email: "a@b.co" };
    mockLevel = "aal2";
    mockAllowlistRow = { user_id: "u1" };
    const result = await requireAdminPage();
    expect(result.ok).toBe(true);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
