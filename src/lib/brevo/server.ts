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
