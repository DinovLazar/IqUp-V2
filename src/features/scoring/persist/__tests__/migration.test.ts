/**
 * Schema ↔ code parity guard (Phase 2.01).
 *
 * Ties the `scores` migration to the row contract so the two can never drift:
 *   - every allowed row key (+ the DB-managed id / created_date / environment) is
 *     a real column; every INDEX_COLUMN target exists;
 *   - the privacy invariants hold IN THE DDL: RLS enabled, NO policies, DATE-ONLY
 *     (no created_at / timestamp), and NO PII column;
 *   - the CHECK enums match the LIVE app types (validity ok/mild/strong — not
 *     "none"; confidence high/medium/low — not "med").
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SCORE_ROW_KEYS, INDEX_COLUMN } from "@/features/scoring/persist";

const MIGRATIONS_DIR = "supabase/migrations";

function readScoresMigration(): string {
  const file = readdirSync(MIGRATIONS_DIR).find((f) =>
    f.endsWith("_create_scores.sql"),
  );
  if (!file) throw new Error("scores migration not found");
  return readFileSync(join(MIGRATIONS_DIR, file), "utf8");
}

/** Strip `--` / block comments. (The `comment on …` STATEMENTS are handled below.) */
function strip(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

const RAW = readScoresMigration();
const DDL = strip(RAW);

/**
 * The `create table public.scores ( … );` column block ONLY — so the no-PII /
 * no-timestamp column scans never trip over the documenting `comment on …`
 * statements (whose prose legitimately mentions "phone", "timestamp", etc.).
 */
const CREATE_BODY = (() => {
  const m = DDL.match(/create table[\s\S]*?\n\);/i);
  if (!m) throw new Error("could not locate the create-table block");
  return m[0];
})();

describe("scores migration — columns match the row contract", () => {
  it("declares every allowed row key as a column", () => {
    for (const key of SCORE_ROW_KEYS) {
      expect(CREATE_BODY, `missing column ${key}`).toMatch(
        new RegExp(`\\b${key}\\b`),
      );
    }
  });

  it("declares the DB-managed columns id / created_date / environment", () => {
    for (const col of ["id", "created_date", "environment"]) {
      expect(CREATE_BODY).toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it("declares every INDEX_COLUMN target", () => {
    for (const col of Object.values(INDEX_COLUMN)) {
      expect(CREATE_BODY).toMatch(new RegExp(`\\b${col}\\b`));
    }
  });
});

describe("scores migration — privacy invariants in the DDL", () => {
  it("enables RLS and defines NO policies", () => {
    expect(DDL).toMatch(/enable row level security/i);
    expect(DDL).not.toMatch(/create policy/i);
  });

  it("is DATE-ONLY — created_date defaults to current_date, no timestamp/created_at", () => {
    expect(CREATE_BODY).toMatch(
      /created_date\s+date\s+not null\s+default\s+current_date/i,
    );
    expect(CREATE_BODY).not.toMatch(/\bcreated_at\b/);
    expect(CREATE_BODY).not.toMatch(/timestamptz/i);
    expect(CREATE_BODY).not.toMatch(/\btimestamp\b/i);
    // The date default must not be a clock value.
    expect(CREATE_BODY).not.toMatch(/\bnow\s*\(\)/i);
  });

  it("declares NO PII column", () => {
    for (const pii of [
      "email",
      "phone",
      "first_name",
      "parent_first_name",
      "surname",
      "last_name",
      "child_name",
      "lead_id",
    ]) {
      expect(CREATE_BODY, `must not declare ${pii}`).not.toMatch(
        new RegExp(`\\b${pii}\\b`),
      );
    }
  });

  it("documents the no-PII / no-join intent in a table comment", () => {
    expect(RAW).toMatch(/comment on table public\.scores is/i);
    expect(RAW.toLowerCase()).toContain("never be joinable");
  });
});

describe("scores migration — CHECK enums match the live app types", () => {
  it("validity_status is ok/mild/strong (not 'none')", () => {
    expect(CREATE_BODY).toMatch(
      /validity_status[^,]*check\s*\(\s*validity_status\s+in\s*\(\s*'ok'\s*,\s*'mild'\s*,\s*'strong'\s*\)/i,
    );
    expect(CREATE_BODY).not.toMatch(/'none'/);
  });

  it("EACH conf_* column is constrained to high/medium/low (not 'med')", () => {
    for (const col of [
      "conf_logic",
      "conf_spatial",
      "conf_memory_focus",
      "conf_planning_speed",
      "conf_learning_stem",
    ]) {
      // Anchor the triple to its own column so a single corrupted/dropped CHECK
      // can't hide behind another column's correct enum.
      expect(CREATE_BODY, `${col} CHECK`).toMatch(
        new RegExp(
          `${col}[^,]*check\\s*\\(\\s*${col}\\s+in\\s*\\(\\s*'high'\\s*,\\s*'medium'\\s*,\\s*'low'\\s*\\)`,
          "i",
        ),
      );
    }
    expect(CREATE_BODY).not.toMatch(/'med'/);
  });

  it("age is constrained to 5–13 and child_gender to the form enum", () => {
    expect(CREATE_BODY).toMatch(
      /age\s+smallint\s+not null\s+check\s*\(\s*age\s+between\s+5\s+and\s+13/i,
    );
    expect(CREATE_BODY).toMatch(/'male'\s*,\s*'female'\s*,\s*'undisclosed'/);
  });
});
