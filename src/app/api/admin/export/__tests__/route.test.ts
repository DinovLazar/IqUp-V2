/**
 * GET /api/admin/export (Phase 2.04) — guard, marketing-only filter, audit write.
 * `server-only` neutralized; the admin guard, the service-role client (audit
 * insert) and the Brevo reader are mocked. The pure `@/features/admin` core
 * (filter / CSV / audit-row builder) runs for real.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminContact } from "@/features/admin";
import type { AdminAuthResult } from "@/lib/supabase/admin-guard";

vi.mock("server-only", () => ({}));

let mockGuard: AdminAuthResult = { ok: false, reason: "unauthenticated" };
let mockContacts: AdminContact[] = [];
let mockInsertError: { code: string } | null = null;
const insertSpy = vi.fn<
  (row: unknown) => Promise<{ error: { code: string } | null }>
>(async () => ({ error: mockInsertError }));

vi.mock("@/lib/supabase/admin-guard", () => ({
  requireAdmin: async () => mockGuard,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClient: () => ({
    from: () => ({ insert: insertSpy }),
  }),
}));

vi.mock("@/lib/brevo/server", () => ({
  resolveBrevoListId: () => 8,
  fetchAllContactsFromList: async () => ({
    contacts: mockContacts,
    total: mockContacts.length,
    truncated: false,
  }),
}));

import { GET } from "../route";

function contact(overrides: Partial<AdminContact> = {}): AdminContact {
  return {
    firstName: "Марија",
    email: "yes@example.com",
    phone: "070",
    city: "Скопје",
    gender: "female",
    consentService: true,
    consentParent: true,
    consentMarketing: true,
    signupAt: "2026-06-24T10:00:00.000Z",
    ...overrides,
  };
}

function req(query = ""): Request {
  return new Request(`http://localhost/api/admin/export${query}`);
}

beforeEach(() => {
  mockGuard = { ok: false, reason: "unauthenticated" };
  mockContacts = [];
  mockInsertError = null;
  insertSpy.mockClear();
});

afterEach(() => vi.restoreAllMocks());

describe("auth boundary", () => {
  it("returns 401 with no data when not an admin", async () => {
    mockGuard = { ok: false, reason: "unauthenticated" };
    mockContacts = [contact()];
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).not.toContain("text/csv");
    expect(insertSpy).not.toHaveBeenCalled();
  });
});

describe("CSV export (authenticated admin)", () => {
  beforeEach(() => {
    mockGuard = { ok: true, userId: "user-1", email: "a@b.co" };
  });

  it("marketing=only returns ONLY consentMarketing=true contacts", async () => {
    mockContacts = [
      contact({ email: "yes@example.com", consentMarketing: true }),
      contact({ email: "no@example.com", consentMarketing: false }),
    ];
    const res = await GET(req("?marketing=only"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");

    const body = await res.text();
    expect(body).toContain("yes@example.com");
    expect(body).not.toContain("no@example.com");

    // Audit row: marketing_only, row_count 1, PII-free.
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.export_type).toBe("marketing_only");
    expect(row.row_count).toBe(1);
    expect(row.actor_user_id).toBe("user-1");
    expect(JSON.stringify(row)).not.toContain("@example.com");
  });

  it("the plain export returns all (filtered) contacts as export_type 'all'", async () => {
    mockContacts = [
      contact({ email: "a@example.com", consentMarketing: true }),
      contact({ email: "b@example.com", consentMarketing: false }),
    ];
    const res = await GET(req());
    const body = await res.text();
    expect(body).toContain("a@example.com");
    expect(body).toContain("b@example.com");
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.export_type).toBe("all");
    expect(row.row_count).toBe(2);
  });

  it("sets an attachment Content-Disposition", async () => {
    mockContacts = [contact()];
    const res = await GET(req());
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toContain(".csv");
  });

  it("is FAIL-CLOSED: an audit write error → 500, no CSV", async () => {
    mockContacts = [contact()];
    mockInsertError = { code: "boom" };
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).not.toContain("text/csv");
  });
});
