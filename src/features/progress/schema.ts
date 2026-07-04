/**
 * The anonymous, on-device progress profile (spec Дел 14.2) — the SINGLE source of
 * the persisted shape. A repeat visit reads the prior result's SUMMARY to compute
 * a local growth comparison; nothing here is a server record and nothing links to
 * a subject.
 *
 * Two guarantees, by construction (mirroring the Store-A `scoreRowSchema`, D-113):
 *   1. NO PII. The shape is a strict Zod object, so `StoredProfile` has EXACTLY
 *      these keys — a name / email / phone / city cannot be added here without a
 *      compile error, and a tampered blob with extra keys fails validation on read.
 *   2. NO JOIN KEY. It carries no `public.scores` surrogate id, no lead id, no
 *      timestamp — only the child's own device holds it, keyed to nothing. Store A
 *      (scores) and Store B (Brevo) stay unjoinable; this third, on-device store
 *      shares no key with either (spec §14.1).
 *
 * Pure module: no clock, no randomness, no `window`. The localStorage IO lives in
 * `storage.ts`; this file only describes + validates the data.
 */

import { z } from "zod";

import type { Band } from "@/components/ui/band-label";
import type { Confidence } from "@/components/ui/confidence-label";
import type { SessionValidity } from "@/features/scoring";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";

/** Band words (tied to the live `Band` type so a rename breaks the build). */
const BAND_VALUES = [
  "development",
  "solid",
  "strong",
  "exceptional",
] as const satisfies readonly Band[];

/** Confidence labels (tied to the live `Confidence` type). */
const CONFIDENCE_VALUES = [
  "high",
  "medium",
  "low",
] as const satisfies readonly Confidence[];

/** Validity verdicts (tied to the live `SessionValidity` type). */
const VALIDITY_VALUES = [
  "ok",
  "mild",
  "strong",
] as const satisfies readonly SessionValidity[];

/** The current local-store schema version (bump when this shape changes). */
export const STORED_PROFILE_SCHEMA = 1 as const;

/** One parent-facing index summary — value drives the pentagon only, never shown. */
const storedIndexSchema = z
  .object({
    /** 0–100; internal geometry, like the pentagon — never rendered as a number. */
    value: z.number().int().min(0).max(100),
    band: z.enum(BAND_VALUES),
    confidence: z.enum(CONFIDENCE_VALUES),
  })
  .strict();

export type StoredIndexSummary = z.infer<typeof storedIndexSchema>;

/**
 * The persisted profile. `.strict()` rejects any unknown key, so a tampered or
 * older blob (or one carrying PII) fails validation and is treated as absent.
 */
export const storedProfileSchema = z
  .object({
    /** Local-store schema version. */
    schema: z.literal(STORED_PROFILE_SCHEMA),
    /** The session seed that produced this result — drives repeat freshness. */
    setSeed: z.string().min(1),
    /** 1-based attempt count; a repeat increments it. */
    attempt: z.number().int().min(1),
    /** Coarse age (non-identifying; already in Store A). */
    age: z.number().int().min(5).max(13),
    /** The 5 parent-facing index summaries, keyed by IndexKey. */
    indices: z.object({
      logic: storedIndexSchema,
      spatial: storedIndexSchema,
      memory: storedIndexSchema,
      planning: storedIndexSchema,
      stem: storedIndexSchema,
    }),
    /** Session validity verdict. */
    validity: z.enum(VALIDITY_VALUES),
    /** The three version stamps the cross-major guard reads (D-134). */
    stamps: z
      .object({
        taskBankVersion: z.string().min(1),
        scoringVersion: z.string().min(1),
        normsVersion: z.string().min(1),
      })
      .strict(),
  })
  .strict();

/** The validated on-device profile — exactly the allowed keys, no PII possible. */
export type StoredProfile = z.infer<typeof storedProfileSchema>;

/** The exact top-level key set (anchors the no-PII / no-join guard tests). */
export const STORED_PROFILE_KEYS = Object.keys(
  storedProfileSchema.shape,
) as Array<keyof StoredProfile>;

/** Runtime type guard — a parsed blob is a valid profile (localStorage is user-writable). */
export function isStoredProfile(value: unknown): value is StoredProfile {
  return storedProfileSchema.safeParse(value).success;
}

/** Index keys, re-exported for consumers that iterate the summaries in order. */
export { INDEX_ORDER };
export type { IndexKey };
