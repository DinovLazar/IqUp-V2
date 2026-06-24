/**
 * Server-only Brevo client (Phase 2.02).
 *
 * Talks to Brevo's REST API with the transactional API key. The key bypasses
 * nothing sensitive in our app, but it is a SECRET and must never reach the
 * browser — two guards enforce that, mirroring `src/lib/supabase/server.ts`:
 *   1. `import "server-only"` — turns any client-component import into a build error.
 *   2. The key is read from `BREVO_API_KEY` (NOT `NEXT_PUBLIC_`), so Next never
 *      inlines it into a client bundle.
 *
 * Two operations, both used only by `POST /api/lead`:
 *   - `upsertLeadContact(...)` → create/update the parent contact (the success gate).
 *   - `sendReportEmail(...)`   → send the branded transactional e-mail + PDF (best-effort).
 *
 * Errors carry only the endpoint + HTTP status + Brevo's machine `code` — never the
 * (possibly PII-bearing) Brevo error message, so the route can log them PII-free.
 */

import "server-only";

import { resolveEnvironment } from "@/lib/env";
import type { AdminContact } from "@/features/admin";

const BREVO_API_BASE = "https://api.brevo.com/v3";

/** The locked-contract sender (Cowork half) — used if the env vars are unset. */
const DEFAULT_SENDER_EMAIL = "noreply@iqup.mk";
const DEFAULT_SENDER_NAME = "IQ UP!";

/** The locked-contract list IDs (Cowork half) — fallbacks if the env vars are unset. */
const DEFAULT_LIST_PRODUCTION = 7;
const DEFAULT_LIST_TEST = 8;

/** Attachment filename — language-neutral, carries no PII. */
const DEFAULT_PDF_FILENAME = "IQ-UP-Izvestaj.pdf";

/**
 * The Brevo contact attribute map (exact names + types from the Cowork contract).
 * `FIRSTNAME` is a Brevo built-in set via attributes; `EMAIL` is the top-level
 * identifier (not here). NO score/result fields ever — the two stores never join.
 */
export interface LeadContactAttributes {
  FIRSTNAME: string;
  PHONE: string;
  CITY: string;
  /** Stable, language-independent gender code (`male`/`female`/`undisclosed`), or "". */
  CHILD_GENDER: string;
  /** Active locale (MVP: "mk"), server-set. */
  LANGUAGE: string;
  CONSENT_SERVICE: boolean;
  CONSENT_PARENT: boolean;
  CONSENT_MARKETING: boolean;
  /** Consent date, server-set, `YYYY-MM-DD` (date-only). */
  CONSENT_DATE: string;
}

/**
 * The locked Brevo attribute NAMES as a runtime constant (the single source the
 * admin contacts reader uses to pull fields back out — brief Task 6). `satisfies
 * Record<keyof LeadContactAttributes, string>` ties it to the upsert contract, so
 * a renamed/typo'd/missing attribute fails to compile here instead of silently
 * reading the wrong field.
 */
export const BREVO_CONTACT_ATTRIBUTES = {
  FIRSTNAME: "FIRSTNAME",
  PHONE: "PHONE",
  CITY: "CITY",
  CHILD_GENDER: "CHILD_GENDER",
  LANGUAGE: "LANGUAGE",
  CONSENT_SERVICE: "CONSENT_SERVICE",
  CONSENT_PARENT: "CONSENT_PARENT",
  CONSENT_MARKETING: "CONSENT_MARKETING",
  CONSENT_DATE: "CONSENT_DATE",
} as const satisfies Record<keyof LeadContactAttributes, string>;

export interface UpsertLeadContactInput {
  email: string;
  attributes: LeadContactAttributes;
  /** The resolved list (production → 7, else → 8). See `resolveBrevoListId`. */
  listId: number;
}

export interface SendReportEmailInput {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  /** The rendered report PDF (1.09) — attached as base64; never stored. */
  pdf: Buffer;
  pdfFilename?: string;
}

/** A Brevo API failure carrying ONLY non-PII fields (endpoint + status + code). */
export class BrevoError extends Error {
  readonly endpoint: string;
  readonly status: number;
  readonly code?: string;
  constructor(endpoint: string, status: number, code?: string) {
    super(
      `Brevo ${endpoint} failed: HTTP ${status}${code ? ` (${code})` : ""}`,
    );
    this.name = "BrevoError";
    this.endpoint = endpoint;
    this.status = status;
    this.code = code;
  }
}

/** Read the secret API key (server-side). Throws a NON-secret error if unset. */
function resolveApiKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new Error("Brevo client is not configured: set BREVO_API_KEY.");
  }
  return key;
}

/** Sender identity from env, falling back to the locked-contract values. */
function resolveSender(): { email: string; name: string } {
  return {
    email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
  };
}

/**
 * Resolve the Brevo list from the SAME server-side environment as `scores.environment`
 * (2.01), so list selection and the score stamp always agree: production → list 7,
 * everything else (dev/preview) → list 8. List = ENVIRONMENT separation, never
 * consent separation (marketing consent is a stored flag, enforced at export time).
 */
export function resolveBrevoListId(): number {
  const env = resolveEnvironment();
  const raw =
    env === "production"
      ? process.env.BREVO_LIST_ID_PRODUCTION
      : process.env.BREVO_LIST_ID_TEST;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return env === "production" ? DEFAULT_LIST_PRODUCTION : DEFAULT_LIST_TEST;
}

/** GET JSON from a Brevo endpoint; throw a PII-free `BrevoError` on a non-2xx response. */
async function brevoGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BREVO_API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "api-key": resolveApiKey(),
      accept: "application/json",
    },
    // Admin reads must always be live (never cached): the contacts view is the
    // source of truth synced from Brevo.
    cache: "no-store",
  });

  if (!response.ok) {
    let code: string | undefined;
    try {
      const parsed = (await response.json()) as { code?: unknown };
      if (typeof parsed?.code === "string") code = parsed.code;
    } catch {
      // Non-JSON error body — keep just the status.
    }
    throw new BrevoError(endpoint, response.status, code);
  }

  return (await response.json()) as T;
}

/** POST JSON to a Brevo endpoint; throw a PII-free `BrevoError` on a non-2xx response. */
async function brevoPost(endpoint: string, body: unknown): Promise<void> {
  const response = await fetch(`${BREVO_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "api-key": resolveApiKey(),
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Extract Brevo's machine `code` only — never echo the message (may carry PII).
    let code: string | undefined;
    try {
      const parsed = (await response.json()) as { code?: unknown };
      if (typeof parsed?.code === "string") code = parsed.code;
    } catch {
      // Non-JSON error body — keep just the status.
    }
    throw new BrevoError(endpoint, response.status, code);
  }
}

/**
 * Create or update the parent contact (`POST /v3/contacts`, `updateEnabled: true`).
 * Built-in `email` + `FIRSTNAME` and the 8 custom attributes, placed on `listId`.
 * Throws `BrevoError` on failure — this is the route's SUCCESS GATE.
 */
export async function upsertLeadContact(
  input: UpsertLeadContactInput,
): Promise<void> {
  await brevoPost("/contacts", {
    email: input.email,
    attributes: input.attributes,
    listIds: [input.listId],
    updateEnabled: true,
  });
}

/**
 * Send the branded transactional e-mail with the PDF attached (`POST /v3/smtp/email`).
 * Sender from `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME`. Throws `BrevoError` on
 * failure — the route calls this BEST-EFFORT (a failure is logged, never fatal).
 */
export async function sendReportEmail(
  input: SendReportEmailInput,
): Promise<void> {
  await brevoPost("/smtp/email", {
    sender: resolveSender(),
    to: [
      input.to.name
        ? { email: input.to.email, name: input.to.name }
        : { email: input.to.email },
    ],
    subject: input.subject,
    htmlContent: input.html,
    textContent: input.text,
    attachment: [
      {
        content: input.pdf.toString("base64"),
        name: input.pdfFilename ?? DEFAULT_PDF_FILENAME,
      },
    ],
  });
}

// ── Admin: read contacts from a Brevo list (Phase 2.04) ─────────────────────
//
// READ-ONLY (MVP is read + export only — no edit/delete from the admin). The
// admin contacts view + CSV export read LIVE from the env-resolved list (prod →
// 7, else → 8) so they are always in sync with Brevo. Only the DISPLAYED fields
// are returned (decision 1: first name, email, phone, city, gender code, the
// three consents, signup time) — NO age, NO score/result field. The Brevo key
// stays server-side: the browser never talks to Brevo.

/** Brevo's max page size for the list-contacts endpoint. */
const BREVO_LIST_PAGE_SIZE = 500;

/** Safety cap for a full-list fetch (filters/pagination run in memory server-side). */
const BREVO_LIST_FETCH_CAP = 5000;

/** Shape of one contact in Brevo's GET list-contacts response (only what we read). */
interface BrevoListContact {
  email?: string;
  createdAt?: string;
  attributes?: Record<string, unknown>;
}
interface BrevoListContactsResponse {
  contacts?: BrevoListContact[];
  count?: number;
}

/** Coerce a Brevo attribute value to boolean (it returns booleans, but be defensive). */
function asBool(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

/** Map a raw Brevo contact → the displayed-fields-only `AdminContact`. */
function toAdminContact(raw: BrevoListContact): AdminContact {
  const a = raw.attributes ?? {};
  return {
    firstName: asString(a[BREVO_CONTACT_ATTRIBUTES.FIRSTNAME]),
    email: asString(raw.email),
    phone: asString(a[BREVO_CONTACT_ATTRIBUTES.PHONE]),
    city: asString(a[BREVO_CONTACT_ATTRIBUTES.CITY]),
    gender: asString(a[BREVO_CONTACT_ATTRIBUTES.CHILD_GENDER]),
    consentService: asBool(a[BREVO_CONTACT_ATTRIBUTES.CONSENT_SERVICE]),
    consentParent: asBool(a[BREVO_CONTACT_ATTRIBUTES.CONSENT_PARENT]),
    consentMarketing: asBool(a[BREVO_CONTACT_ATTRIBUTES.CONSENT_MARKETING]),
    // DATE-ONLY (YYYY-MM-DD) — matches the on-screen table and the project's
    // date-only convention; the exact contact creation time never reaches a view.
    signupAt: asString(raw.createdAt).slice(0, 10),
  };
}

export interface ListContactsInput {
  listId: number;
  /** Page size (Brevo max 500). */
  limit: number;
  offset: number;
}

/**
 * One page of contacts from a Brevo list (`GET /v3/contacts/lists/{id}/contacts`),
 * mapped to the displayed-fields-only `AdminContact[]`. `count` is the list total
 * Brevo reports. Newest first (`sort=desc`, Brevo orders by creation).
 */
export async function listContactsFromList(
  input: ListContactsInput,
): Promise<{ contacts: AdminContact[]; count: number }> {
  const limit = Math.min(Math.max(1, input.limit), BREVO_LIST_PAGE_SIZE);
  const offset = Math.max(0, input.offset);
  const data = await brevoGet<BrevoListContactsResponse>(
    `/contacts/lists/${input.listId}/contacts?limit=${limit}&offset=${offset}&sort=desc`,
  );
  return {
    contacts: (data.contacts ?? []).map(toAdminContact),
    count: typeof data.count === "number" ? data.count : 0,
  };
}

/**
 * Fetch the WHOLE list (bounded by `BREVO_LIST_FETCH_CAP`), mapped to
 * `AdminContact[]`, so filtering + pagination can run in memory server-side
 * (Brevo's list endpoint cannot filter by attribute). `truncated` is true if the
 * list exceeds the cap — the caller surfaces that rather than silently dropping.
 */
export async function fetchAllContactsFromList(input: {
  listId: number;
  max?: number;
}): Promise<{ contacts: AdminContact[]; total: number; truncated: boolean }> {
  const max = Math.max(1, input.max ?? BREVO_LIST_FETCH_CAP);
  const all: AdminContact[] = [];
  let total = 0;
  let offset = 0;

  while (all.length < max) {
    const { contacts, count } = await listContactsFromList({
      listId: input.listId,
      limit: BREVO_LIST_PAGE_SIZE,
      offset,
    });
    total = count;
    all.push(...contacts);
    offset += BREVO_LIST_PAGE_SIZE;
    if (contacts.length < BREVO_LIST_PAGE_SIZE) break; // last page
    // Only trust `total` to stop paging when it is positive — a malformed/zero
    // count must not short-circuit a genuinely full page (the short-page check
    // above already terminates the real last page).
    if (total > 0 && all.length >= total) break;
  }

  const truncated = total > all.length || total > max;
  return { contacts: all.slice(0, max), total, truncated };
}
