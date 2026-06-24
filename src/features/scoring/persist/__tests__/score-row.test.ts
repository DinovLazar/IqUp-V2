/**
 * buildScoreRow + scoreRowSchema (Phase 2.01).
 *
 * The guarantees this phase rests on:
 *   - the row has EXACTLY the allowed key set — no PII, no lead id, no timestamp;
 *   - the strict schema REJECTS any of those if smuggled in;
 *   - the version stamps + norms_stage are carried through from result.meta;
 *   - the 8 signals + 5 indices are present, in range, mapped to the right column;
 *   - the builder is pure (same input ⇒ deep-equal row).
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildScoreRow,
  scoreRowSchema,
  SCORE_ROW_KEYS,
  SIGNAL_KEYS,
  INDEX_COLUMN,
  type ScoreDemographics,
} from "@/features/scoring/persist";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";
import type { AssessmentResult } from "@/features/scoring";
import { INDEX_ORDER } from "@/lib/indices";

const DEMO: ScoreDemographics = {
  city: "Скопје",
  childGender: "female",
  language: "mk",
};

/** A fresh, deep-cloned result so per-test overrides never leak. */
function freshResult(): AssessmentResult {
  return structuredClone(scoreProfile(logicStrong));
}

/** The complete, hand-listed allowed key set (the canonical anti-PII contract). */
const EXPECTED_KEYS = [
  "age",
  "child_gender",
  "city",
  "language",
  // 8 signals
  "gf",
  "gv",
  "gsm",
  "gs",
  "attention",
  "ef",
  "glr",
  "ct",
  // 5 indices
  "logic",
  "spatial",
  "memory_focus",
  "planning_speed",
  "learning_stem",
  // 5 confidences
  "conf_logic",
  "conf_spatial",
  "conf_memory_focus",
  "conf_planning_speed",
  "conf_learning_stem",
  // validity + versions
  "validity_status",
  "task_bank_version",
  "scoring_version",
  "norms_version",
  "norms_stage",
].sort();

/** Anything that would link the row to a parent, a lead, or a precise time. */
const FORBIDDEN_KEYS = [
  "email",
  "phone",
  "parentFirstName",
  "parent_first_name",
  "name",
  "firstName",
  "first_name",
  "surname",
  "last_name",
  "childName",
  "child_name",
  "consentService",
  "consentParent",
  "consentMarketing",
  "lead",
  "leadId",
  "lead_id",
  "id",
  "created_at",
  "createdAt",
  "created_date",
  "timestamp",
  "time",
  "ip",
  "environment",
];

describe("buildScoreRow — allowed key set", () => {
  it("produces EXACTLY the allowed keys (anti-PII contract)", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    expect(Object.keys(row).sort()).toEqual(EXPECTED_KEYS);
  });

  it("the schema's key set equals the built row's key set", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    expect([...SCORE_ROW_KEYS].sort()).toEqual(Object.keys(row).sort());
    expect([...SCORE_ROW_KEYS].sort()).toEqual(EXPECTED_KEYS);
  });

  it("carries NO PII / lead-id / timestamp / environment key", () => {
    const row = buildScoreRow(freshResult(), DEMO) as Record<string, unknown>;
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(row, `row must not carry "${forbidden}"`).not.toHaveProperty(
        forbidden,
      );
    }
  });
});

describe("scoreRowSchema — strict (rejects PII / extras / client dates)", () => {
  it("accepts a freshly built row", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    expect(scoreRowSchema.safeParse(row).success).toBe(true);
  });

  it("rejects a row with a PII field added", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    for (const pii of ["email", "phone", "parentFirstName", "lead_id"]) {
      const result = scoreRowSchema.safeParse({ ...row, [pii]: "x" });
      expect(result.success, `must reject "${pii}"`).toBe(false);
    }
  });

  it("rejects a client-supplied date / timestamp / environment", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    for (const sneaky of [
      { created_date: "2020-01-01" },
      { created_at: "2020-01-01T00:00:00Z" },
      { environment: "production" },
      { id: "00000000-0000-0000-0000-000000000000" },
    ]) {
      const result = scoreRowSchema.safeParse({ ...row, ...sneaky });
      expect(result.success, `must reject ${Object.keys(sneaky)[0]}`).toBe(
        false,
      );
    }
  });

  it("rejects out-of-range scores and bad enums", () => {
    const row = buildScoreRow(freshResult(), DEMO);
    expect(scoreRowSchema.safeParse({ ...row, gf: 101 }).success).toBe(false);
    expect(scoreRowSchema.safeParse({ ...row, logic: -1 }).success).toBe(false);
    expect(scoreRowSchema.safeParse({ ...row, age: 4 }).success).toBe(false);
    expect(scoreRowSchema.safeParse({ ...row, age: 14 }).success).toBe(false);
    expect(
      scoreRowSchema.safeParse({ ...row, conf_logic: "med" }).success,
    ).toBe(false);
    expect(
      scoreRowSchema.safeParse({ ...row, validity_status: "none" }).success,
    ).toBe(false);
  });
});

describe("buildScoreRow — values", () => {
  it("pulls age from result.meta and version stamps from result.meta", () => {
    const result = freshResult();
    const row = buildScoreRow(result, DEMO);
    expect(row.age).toBe(result.meta.age);
    expect(row.task_bank_version).toBe(result.meta.taskBankVersion);
    expect(row.scoring_version).toBe(result.meta.scoringVersion);
    expect(row.norms_version).toBe(result.meta.normsVersion);
    expect(row.norms_stage).toBe(result.meta.normsStage);
    expect(row.norms_stage).toBe("seed");
    expect(row.validity_status).toBe(result.validity.session);
  });

  it("maps childGender (set → value, absent → null) and passes city/language", () => {
    const set = buildScoreRow(freshResult(), DEMO);
    expect(set.child_gender).toBe("female");
    expect(set.city).toBe("Скопје");
    expect(set.language).toBe("mk");

    const absent = buildScoreRow(freshResult(), {
      city: "Битола",
      language: "mk",
    });
    expect(absent.child_gender).toBeNull();
  });

  it("carries all 8 signals + 5 indices, each an integer in [0,100]", () => {
    const row = buildScoreRow(freshResult(), DEMO) as Record<string, unknown>;
    const numericCols = [
      ...SIGNAL_KEYS,
      ...INDEX_ORDER.map((k) => INDEX_COLUMN[k]),
    ];
    expect(numericCols).toHaveLength(13);
    for (const col of numericCols) {
      const v = row[col];
      expect(typeof v, `${col} numeric`).toBe("number");
      expect(Number.isInteger(v as number), `${col} integer`).toBe(true);
      expect(v as number).toBeGreaterThanOrEqual(0);
      expect(v as number).toBeLessThanOrEqual(100);
    }
  });

  it("SIGNAL_KEYS is exactly the result's signal set (8)", () => {
    const result = freshResult();
    expect([...SIGNAL_KEYS].sort()).toEqual(Object.keys(result.signals).sort());
    expect(SIGNAL_KEYS).toHaveLength(8);
  });
});

describe("buildScoreRow — IndexKey → column mapping is correct", () => {
  it("each index value + confidence lands in its mapped column", () => {
    const result = freshResult();
    // Distinct values per index so a swap would be caught.
    result.indices.logic.value = 11;
    result.indices.spatial.value = 22;
    result.indices.memory.value = 33;
    result.indices.planning.value = 44;
    result.indices.stem.value = 55;
    result.indices.logic.confidence = "high";
    result.indices.spatial.confidence = "medium";
    result.indices.memory.confidence = "low";
    result.indices.planning.confidence = "high";
    result.indices.stem.confidence = "medium";

    const row = buildScoreRow(result, DEMO) as Record<string, unknown>;

    expect(row[INDEX_COLUMN.logic]).toBe(11);
    expect(row[INDEX_COLUMN.spatial]).toBe(22);
    expect(row[INDEX_COLUMN.memory]).toBe(33);
    expect(row[INDEX_COLUMN.planning]).toBe(44);
    expect(row[INDEX_COLUMN.stem]).toBe(55);

    expect(row[`conf_${INDEX_COLUMN.logic}`]).toBe("high");
    expect(row[`conf_${INDEX_COLUMN.spatial}`]).toBe("medium");
    expect(row[`conf_${INDEX_COLUMN.memory}`]).toBe("low");
    expect(row[`conf_${INDEX_COLUMN.planning}`]).toBe("high");
    expect(row[`conf_${INDEX_COLUMN.stem}`]).toBe("medium");

    // The descriptive column names are exactly what the migration declares.
    expect(INDEX_COLUMN).toEqual({
      logic: "logic",
      spatial: "spatial",
      memory: "memory_focus",
      planning: "planning_speed",
      stem: "learning_stem",
    });
  });

  it("each signal value lands in its own column", () => {
    const result = freshResult();
    result.signals.gf.index = 61;
    result.signals.attention.index = 62;
    result.signals.ct.index = 63;
    const row = buildScoreRow(result, DEMO);
    expect(row.gf).toBe(61);
    expect(row.attention).toBe(62);
    expect(row.ct).toBe(63);
  });
});

describe("buildScoreRow — pure", () => {
  it("same input ⇒ deep-equal row (no clock/random/env)", () => {
    const a = buildScoreRow(freshResult(), DEMO);
    const b = buildScoreRow(freshResult(), DEMO);
    expect(a).toEqual(b);
  });

  it("the source carries no clock / randomness / env", () => {
    const src = readFileSync(
      "src/features/scoring/persist/score-row.ts",
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const re of [
      /Math\.random/,
      /\bnew Date\b/,
      /\bDate\.now\b/,
      /performance\.now/,
      /process\.env/,
      /\bfetch\b/,
    ]) {
      expect(src).not.toMatch(re);
    }
  });
});
