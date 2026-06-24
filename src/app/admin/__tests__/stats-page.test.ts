/**
 * /admin stats page wiring (Phase 2.04). Pins invariant 4: the page aggregates
 * IN Postgres via the `admin_score_stats` RPC, ENV-SCOPED to the resolved
 * environment (so production stats never mix with preview/test), and reads NO
 * contacts. The guard, env resolver, service client and i18n are mocked; calling
 * the async server component runs the data fetch (the JSX is not rendered).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const rpcSpy = vi.fn<
  (fn: string, args: unknown) => Promise<{ data: { total: number } }>
>(async () => ({ data: { total: 0 } }));

vi.mock("@/lib/supabase/admin-guard", () => ({
  requireAdminPage: async () => ({ ok: true, userId: "u1", email: "a@b.co" }),
}));

vi.mock("@/lib/env", () => ({
  resolveEnvironment: () => "production",
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClient: () => ({ rpc: rpcSpy }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

import AdminStatsPage from "../page";

beforeEach(() => rpcSpy.mockClear());
afterEach(() => vi.restoreAllMocks());

describe("AdminStatsPage RPC wiring", () => {
  it("calls admin_score_stats scoped to the resolved environment", async () => {
    await AdminStatsPage();
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    expect(rpcSpy).toHaveBeenCalledWith("admin_score_stats", {
      p_environment: "production",
    });
  });

  it("never calls a contacts RPC/function (stats read only scores)", async () => {
    await AdminStatsPage();
    const calledFns = rpcSpy.mock.calls.map((c) => c[0]);
    expect(calledFns).toEqual(["admin_score_stats"]);
  });
});
