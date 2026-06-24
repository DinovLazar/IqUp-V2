/**
 * Admin migrations ↔ code parity (Phase 2.04), mirroring the 2.01
 * scores migration test:
 *   - the SQL `score_band` cut-offs equal the app `BAND_THRESHOLDS` (§6.4);
 *   - admin_users + admin_export_log enable RLS with NO policies (locked);
 *   - admin_export_log carries NO parent PII column;
 *   - the stats RPC execute is granted to service_role and revoked from
 *     anon/authenticated (so only the server-only client can call it).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { BAND_THRESHOLDS } from "@/content/norms";

const migrationsDir = fileURLToPath(
  new URL("../../../../supabase/migrations/", import.meta.url),
);

function sql(file: string): string {
  return readFileSync(`${migrationsDir}${file}`, "utf8");
}

const adminUsers = sql("20260624120000_create_admin_users.sql");
const exportLog = sql("20260624120100_create_admin_export_log.sql");
const stats = sql("20260624120200_create_admin_score_stats.sql");
const lock = sql("20260624120300_lock_admin_score_stats_execute.sql");

describe("score_band cut-offs match BAND_THRESHOLDS", () => {
  it("uses the exact §6.4 thresholds", () => {
    expect(stats).toContain(
      `when value >= ${BAND_THRESHOLDS.exceptional} then 'exceptional'`,
    );
    expect(stats).toContain(
      `when value >= ${BAND_THRESHOLDS.strong} then 'strong'`,
    );
    expect(stats).toContain(
      `when value >= ${BAND_THRESHOLDS.solid} then 'solid'`,
    );
    expect(stats).toContain("else 'development'");
  });

  it("BAND_THRESHOLDS are the expected seed values (guards both sides)", () => {
    expect(BAND_THRESHOLDS).toMatchObject({
      exceptional: 80,
      strong: 64,
      solid: 45,
    });
  });
});

describe("admin tables are RLS-locked with no policies", () => {
  for (const [name, ddl] of [
    ["admin_users", adminUsers],
    ["admin_export_log", exportLog],
  ] as const) {
    it(`${name} enables RLS and defines NO policy`, () => {
      expect(ddl).toMatch(/enable row level security/i);
      expect(ddl).not.toMatch(/create policy/i);
    });
  }
});

/** Strip `--` line comments and `comment on … ;` statements (they intentionally
 * name PII to explain it is NOT stored) so the scan only sees real DDL. */
function ddlOnly(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .replace(/comment on[\s\S]*?;/gi, "")
    .toLowerCase();
}

describe("admin_export_log holds no parent PII", () => {
  it("has no email/phone/name/firstname column (comments excluded)", () => {
    const ddl = ddlOnly(exportLog);
    for (const token of ["email", "phone", "firstname", "surname"]) {
      expect(ddl).not.toContain(token);
    }
  });

  it("records the audit fields", () => {
    for (const col of [
      "actor_user_id",
      "export_type",
      "filters",
      "row_count",
    ]) {
      expect(exportLog).toContain(col);
    }
  });
});

describe("admin_score_stats execute is locked to service_role", () => {
  it("grants execute to service_role", () => {
    expect(stats).toMatch(
      /grant execute on function public\.admin_score_stats\(text\) to service_role/i,
    );
  });

  it("revokes execute from anon + authenticated (lockdown migration)", () => {
    expect(lock).toMatch(
      /revoke all on function public\.admin_score_stats\(text\) from anon, authenticated/i,
    );
  });
});
