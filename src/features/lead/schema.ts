/**
 * The lead-form contract (spec Дел 11 / 13.1) — the SINGLE source of validation,
 * shared by the browser form (Phase 1.08) and, unchanged, the Part-2 API route.
 * Framework-free on purpose: no React, no next-intl, no browser globals — only
 * Zod. Error messages are stable TOKENS (not prose), so the same schema yields
 * the same machine-readable failures on the client and the server; each surface
 * maps a token to its own localized copy (the form via `messages/mk.json`).
 *
 * Privacy (spec Дел 13.1 / 14.3): parent FIRST NAME only — there is no surname
 * field and no child-name field anywhere. The three consents are separate; the
 * two required ones must be `true` to pass — enforced HERE, in the schema, not
 * only in the UI (DoD / resolved-decision 3).
 */

import { z } from "zod";

/** Child gender is optional; internal keys, MK labels live in `messages/mk.json`. */
export const GENDER_VALUES = ["male", "female", "undisclosed"] as const;
export type ChildGender = (typeof GENDER_VALUES)[number];

const MAX_NAME = 80;
const MAX_CITY = 80;

/** Characters a plausible phone may contain — permissive on purpose (Decision 3). */
const PHONE_ALLOWED = /^[0-9+\-()\s]+$/;

/**
 * Permissive phone check: allowed glyphs only + a sane digit count. No strict
 * Macedonian normalization in the MVP — valid international formats must pass.
 */
export function isPlausiblePhone(value: string): boolean {
  if (!PHONE_ALLOWED.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

/**
 * Required-consent rule. Modeled as a boolean that MUST equal `true`, so the
 * field's input type stays `boolean` (a checkbox defaults to `false`, never
 * pre-ticked) while the schema itself rejects `false`/absent — the literal-`true`
 * requirement, enforced in the schema (Decision 3).
 */
const requiredConsent = (token: string) =>
  z.boolean({ message: token }).refine((v) => v === true, { message: token });

export const leadSchema = z.object({
  // First name only — trimmed, non-empty, sane max. No surname, no child name.
  parentFirstName: z
    .string({ message: "firstNameRequired" })
    .trim()
    .min(1, { message: "firstNameRequired" })
    .max(MAX_NAME, { message: "firstNameTooLong" }),

  // Required, valid email (Zod's own validator).
  email: z
    .string({ message: "emailRequired" })
    .trim()
    .min(1, { message: "emailRequired" })
    .email({ message: "emailInvalid" }),

  // Required, permissively validated (presence + basic shape).
  phone: z
    .string({ message: "phoneRequired" })
    .trim()
    .min(1, { message: "phoneRequired" })
    .refine(isPlausiblePhone, { message: "phoneInvalid" }),

  // Required free-text for now. A swap to a centers-by-city <select> in Part 2 is
  // a localized change at the field's UI seam — the schema stays a non-empty string.
  city: z
    .string({ message: "cityRequired" })
    .trim()
    .min(1, { message: "cityRequired" })
    .max(MAX_CITY, { message: "cityTooLong" }),

  // Optional — absent is valid.
  childGender: z.enum(GENDER_VALUES).optional(),

  // Two required consents (must be true) + one optional marketing consent.
  consentService: requiredConsent("consentServiceRequired"),
  consentParent: requiredConsent("consentParentRequired"),
  consentMarketing: z.boolean().optional(),
});

/** The validated, parsed lead values (trimmed strings). */
export type LeadFormValues = z.infer<typeof leadSchema>;
