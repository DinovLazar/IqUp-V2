/**
 * Phase 3.01 — the anonymous on-device profile is a PII-free, join-free summary
 * (spec Дел 14.2 / §14.1). buildStoredProfile maps a scored result → exactly the
 * index summaries + validity + stamps + seed + attempt, and nothing else.
 */

import { describe, expect, it } from "vitest";
import { INDEX_ORDER } from "@/lib/indices";
import { scoreProfile, flatTypical } from "@/features/assessment/fixtures";
import { buildStoredProfile } from "../summary";
import {
  STORED_PROFILE_KEYS,
  isStoredProfile,
  storedProfileSchema,
} from "../schema";

const result = scoreProfile(flatTypical);
const profile = buildStoredProfile(result, { setSeed: "seed-a", attempt: 1 });

describe("buildStoredProfile (Дел 14.2)", () => {
  it("carries the summary + stamps + seed + attempt, keyed to nothing", () => {
    expect(profile.schema).toBe(1);
    expect(profile.setSeed).toBe("seed-a");
    expect(profile.attempt).toBe(1);
    expect(profile.age).toBe(result.meta.age);
    expect(profile.validity).toBe(result.validity.session);
    expect(profile.stamps).toEqual({
      taskBankVersion: result.meta.taskBankVersion,
      scoringVersion: result.meta.scoringVersion,
      normsVersion: result.meta.normsVersion,
    });
    for (const key of INDEX_ORDER) {
      expect(profile.indices[key]).toEqual({
        value: result.indices[key].value,
        band: result.indices[key].band,
        confidence: result.indices[key].confidence,
      });
    }
  });

  it("is a valid, schema-strict profile (round-trips through the guard)", () => {
    expect(isStoredProfile(profile)).toBe(true);
    expect(storedProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("stores NO PII and NO join key (the whole point — §14.1)", () => {
    // The top-level key set is fixed and free of any lead/identity field.
    expect(STORED_PROFILE_KEYS.sort()).toEqual(
      [
        "age",
        "attempt",
        "indices",
        "schema",
        "setSeed",
        "stamps",
        "validity",
      ].sort(),
    );
    // PII + obvious lead/score join keys. NB: the profile DOES store `setSeed`
    // (the session master seed) intentionally — it is on-device-only and, crucially,
    // is NOT a column in `public.scores` (Store A has no seed/id/timestamp), so it
    // cannot correlate this store with either the score or the Brevo store.
    const forbidden = [
      "name",
      "firstName",
      "parentFirstName",
      "email",
      "phone",
      "city",
      "childGender",
      "leadId",
      "createdAt",
      "created_date",
    ];
    const flat = JSON.stringify(profile).toLowerCase();
    for (const key of forbidden) {
      expect(STORED_PROFILE_KEYS as string[]).not.toContain(key);
      // also not smuggled into a nested key name
      expect(flat).not.toContain(`"${key.toLowerCase()}"`);
    }
  });

  it("a tampered blob with an extra key fails validation (treated as absent)", () => {
    const tampered = { ...profile, email: "x@example.com" };
    expect(isStoredProfile(tampered)).toBe(false);
  });
});
