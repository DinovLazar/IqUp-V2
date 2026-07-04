/**
 * buildStoredProfile — the pure mapping from a scored session to the anonymous,
 * on-device progress profile (spec Дел 14.2). This is the one place an
 * `AssessmentResult` becomes the persisted SUMMARY.
 *
 * PII-free + join-free by construction (the shape is the strict `storedProfileSchema`):
 * only the 5 index summaries (value/band/confidence — the value is pentagon
 * geometry, never shown as a number), the validity verdict, the age, the set seed,
 * the attempt count, and the three version stamps. No name/email/phone/city, no
 * score-row id, no lead id, no timestamp. Pure: same input ⇒ deep-equal profile.
 */

import type { AssessmentResult } from "@/features/scoring";
import { INDEX_ORDER } from "@/lib/indices";
import {
  STORED_PROFILE_SCHEMA,
  type StoredIndexSummary,
  type StoredProfile,
} from "./schema";

/** What the caller supplies alongside the result: the seed used + which attempt. */
export interface StoredProfileMeta {
  /** The session seed that produced this result (its first-run or repeat seed). */
  setSeed: string;
  /** 1-based attempt number for this child on this device. */
  attempt: number;
}

/** Map a scored session + its seed/attempt → the anonymous on-device profile. */
export function buildStoredProfile(
  result: AssessmentResult,
  meta: StoredProfileMeta,
): StoredProfile {
  const indices = {} as StoredProfile["indices"];
  for (const key of INDEX_ORDER) {
    const idx = result.indices[key];
    const summary: StoredIndexSummary = {
      value: idx.value,
      band: idx.band,
      confidence: idx.confidence,
    };
    indices[key] = summary;
  }

  return {
    schema: STORED_PROFILE_SCHEMA,
    setSeed: meta.setSeed,
    attempt: meta.attempt,
    age: result.meta.age,
    indices,
    validity: result.validity.session,
    stamps: {
      taskBankVersion: result.meta.taskBankVersion,
      scoringVersion: result.meta.scoringVersion,
      normsVersion: result.meta.normsVersion,
    },
  };
}
