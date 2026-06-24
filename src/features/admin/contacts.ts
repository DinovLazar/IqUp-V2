/**
 * Admin contacts — the displayed-fields shape + pure filter/paginate logic
 * (Phase 2.04). No network, no React: the Brevo fetch + mapping lives in the
 * server-only `src/lib/brevo/server.ts`; this module is the pure core the page,
 * the export route, and the tests share.
 *
 * PRIVACY INVARIANT (spec §14.1 / §15, resolved decision 1): a contact carries
 * ONLY what the Brevo lead store holds — first name, email, phone, city, gender
 * code, the three consents, and the signup time. There is deliberately NO `age`
 * and NO score/result field: age + results live only in the anonymous scores
 * store (Store A), and showing them per-contact would require joining the two
 * stores, which §14.1 forbids. `ADMIN_CONTACT_KEYS` is asserted by a test to be
 * exactly this set (no age, no index/signal/score keys).
 */

import { GENDER_VALUES } from "@/features/lead/schema";

export interface AdminContact {
  /** Parent FIRST name only (no surname, never a child name). */
  firstName: string;
  email: string;
  phone: string;
  city: string;
  /** Stable gender CODE: "male" | "female" | "undisclosed" | "" (absent). */
  gender: string;
  consentService: boolean;
  consentParent: boolean;
  consentMarketing: boolean;
  /** Signup DATE (YYYY-MM-DD) — Brevo contact `createdAt` sliced to the date, "" if unknown. */
  signupAt: string;
}

/**
 * The EXACT displayed key set. A test asserts this contains no `age` and no
 * score/index/signal key — the structural guard for the unjoinable invariant.
 */
export const ADMIN_CONTACT_KEYS = [
  "firstName",
  "email",
  "phone",
  "city",
  "gender",
  "consentService",
  "consentParent",
  "consentMarketing",
  "signupAt",
] as const satisfies readonly (keyof AdminContact)[];

export type MarketingFilter = "yes" | "no";

export interface ContactFilters {
  /** Case-insensitive substring match on city. */
  city?: string;
  /** Exact gender code match (male/female/undisclosed). */
  gender?: string;
  /** "yes" → consentMarketing true; "no" → false; undefined → any. */
  marketing?: MarketingFilter;
}

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

/**
 * Parse the `?city=&gender=&marketing=` query params into validated filters.
 * `marketing` accepts "yes"/"no" and, for the export route's convenience, "only"
 * (≡ "yes" = marketing-consent-only). Unknown values are dropped (no filter).
 */
export function parseContactFilters(params: RawParams): ContactFilters {
  const filters: ContactFilters = {};

  const city = firstParam(params.city);
  if (city) filters.city = city;

  const gender = firstParam(params.gender);
  if ((GENDER_VALUES as readonly string[]).includes(gender)) {
    filters.gender = gender;
  }

  const marketing = firstParam(params.marketing).toLowerCase();
  if (marketing === "yes" || marketing === "only") filters.marketing = "yes";
  else if (marketing === "no") filters.marketing = "no";

  return filters;
}

/** Apply the filters in memory (server-side; the Brevo key never reaches the client). */
export function filterContacts(
  contacts: readonly AdminContact[],
  filters: ContactFilters,
): AdminContact[] {
  const cityNeedle = filters.city?.toLowerCase();
  return contacts.filter((c) => {
    if (cityNeedle && !c.city.toLowerCase().includes(cityNeedle)) return false;
    if (filters.gender && c.gender !== filters.gender) return false;
    if (filters.marketing === "yes" && c.consentMarketing !== true)
      return false;
    if (filters.marketing === "no" && c.consentMarketing !== false)
      return false;
    return true;
  });
}

export const CONTACTS_PAGE_SIZE = 25;

export interface Page<T> {
  items: T[];
  /** 1-based current page (clamped into [1, pageCount]). */
  page: number;
  pageCount: number;
  total: number;
}

/** Pure 1-based pagination over an in-memory array. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number = CONTACTS_PAGE_SIZE,
): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total,
  };
}

/** Whether the export of these filters is the marketing-consent-only variant. */
export function exportTypeFor(
  filters: ContactFilters,
): "all" | "marketing_only" {
  return filters.marketing === "yes" ? "marketing_only" : "all";
}
