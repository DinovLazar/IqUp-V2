/**
 * The on-device cookie-consent record (Phase 3.03a — spec §16.3 / Дел 14) — the
 * SINGLE source of the persisted shape. It records ONLY whether the visitor
 * allowed non-essential (analytics) cookies; it carries no PII and no key that
 * could join it to the anonymous score store (Store A) or the Brevo lead store
 * (Store B). It is a third, purely on-device store (D-170), mirroring the progress
 * profile (Дел 14.2).
 *
 * Two guarantees, by construction (like the progress `StoredProfile`, D-113):
 *   1. NO PII. A strict Zod object — `decision` + `version` + an optional
 *      date-only `decidedAt`; nothing else can be added without a compile error,
 *      and a tampered blob with extra / wrong-typed keys fails validation on read.
 *   2. NO JOIN KEY. No surrogate id, no lead id, no fine-grained timestamp (a
 *      calendar date is the finest granularity — coarser than a session), so it
 *      shares no key with either server store (spec §14.1).
 *
 * Pure module: no clock, no randomness, no `window`. The localStorage IO + the
 * date stamp live in `storage.ts`; this file only describes + validates the data.
 */

import { z } from "zod";

/** The two explicit choices a visitor can make — no ambiguous third state (D-168). */
export type ConsentDecision = "accepted" | "declined";

/**
 * The stored-blob version. Bumped ONLY if the MEANING of a decision changes (e.g. a
 * new cookie category that must be re-asked); a bump invalidates old blobs on read
 * (the key `iqup:cookie-consent:vN` is versioned too), so the banner reappears.
 */
export const CONSENT_VERSION = 1 as const;

/**
 * The persisted blob. `.strict()` rejects any unknown key, so a tampered or older
 * blob (or one carrying PII) fails validation and is treated as "no decision".
 * `decidedAt` is date-only (`YYYY-MM-DD`) — never finer, so it cannot become a
 * correlating timestamp.
 */
export const storedConsentSchema = z
  .object({
    decision: z.enum(["accepted", "declined"]),
    version: z.literal(CONSENT_VERSION),
    decidedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

/** The validated on-device consent — exactly the allowed keys, no PII possible. */
export type StoredConsent = z.infer<typeof storedConsentSchema>;

/** Runtime type guard — a parsed blob is a valid record (localStorage is user-writable). */
export function isStoredConsent(value: unknown): value is StoredConsent {
  return storedConsentSchema.safeParse(value).success;
}
