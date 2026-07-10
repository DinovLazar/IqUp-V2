/**
 * POST /api/lead — capture the parent lead in Brevo + e-mail the branded PDF report
 * (spec §10.1 on-submit sequence; §13.1/§13.2 fields + Brevo's role).
 *
 * Sequence (Meta/GA4 are intentionally NOT here — that is 2.03):
 *   1. Validate the lead fields with the SHARED 1.08 `leadSchema` (rejects invalid
 *      input + missing required consents). `result` is carried alongside and the
 *      server derives `CONSENT_DATE` + `LANGUAGE` (the client sends neither).
 *   2. Upsert the parent as a Brevo contact (built-ins + the 8 custom attributes,
 *      onto list 7 in production / 8 otherwise). This is the SUCCESS GATE — if it
 *      fails, the route fails and the confirmation does not render.
 *   3. BEST-EFFORT: re-assemble the report server-side from the submitted `result`
 *      (1.07 `assembleReport` — deterministic, so the PDF provably matches the
 *      on-screen report), render the PDF (1.09 `renderReportPdf`), build the
 *      branded e-mail (in-repo HTML + text, all copy from mk.json), and send it
 *      with the PDF attached. ANY failure here (incl. the pre-DNS `noreply@`
 *      rejection) is logged PII-free and the route STILL returns success.
 *
 * Persists NOTHING beyond the Brevo contact: no PDF, no result, no score write
 * (that is the separate, non-blocking `/api/score` path from 2.01). The contact
 * carries ZERO score/result fields — the two stores never join (spec §14.1).
 */

import { NextResponse } from "next/server";

import { leadSchema } from "@/features/lead/schema";
import { buildBookingHref, resolveBookingUrl } from "@/features/lead/cta";
import { assembleReport } from "@/features/report";
import { renderReportPdf } from "@/features/report/pdf";
import type { AssessmentResult } from "@/features/scoring";
import {
  resolveBrevoListId,
  sendReportEmail,
  upsertLeadContact,
} from "@/lib/brevo/server";
import { buildReportEmail } from "@/lib/brevo/email-template";

export const runtime = "nodejs";
// A write + outbound e-mail — never cached / statically optimized.
export const dynamic = "force-dynamic";

/** Enabled assessment locales (Feat-Serbian-Localization). Anything else → `mk`. */
type LeadLang = "mk" | "sr";
function resolveLeadLang(value: unknown): LeadLang {
  return value === "sr" ? "sr" : "mk";
}

/** Today as `YYYY-MM-DD` (date-only) — server-set consent date. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Parse JSON (malformed → 400, no echo).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  // 2. Validate the lead fields (the shared schema strips the carried `result`).
  //    Missing required consents (consentService/consentParent) fail here.
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    // Field PATHS only (no values) — safe, useful for debugging the client.
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(",");
    console.warn(`[/api/lead] rejected payload (fields: ${fields || "—"})`);
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }
  const values = parsed.data;

  // The active locale the assessment ran in (Feat-Serbian-Localization). The
  // `leadSchema` strips it, so it is read from the raw body alongside `result`.
  const lang = resolveLeadLang((body as { locale?: unknown }).locale);

  // 3. Build the contact attributes (exact Brevo names/types). `CHILD_GENDER` is
  //    the stable language-independent code (matches the score row), "" if absent;
  //    `LANGUAGE` + `CONSENT_DATE` are server-set; consents are passed as given.
  //    NO score/result fields — the contact carries none.
  const contact = {
    email: values.email,
    attributes: {
      FIRSTNAME: values.parentFirstName,
      PHONE: values.phone,
      CITY: values.city,
      CHILD_GENDER: values.childGender ?? "",
      LANGUAGE: lang,
      CONSENT_SERVICE: values.consentService,
      CONSENT_PARENT: values.consentParent,
      CONSENT_MARKETING: values.consentMarketing === true,
      CONSENT_DATE: today(),
    },
    listId: resolveBrevoListId(),
  };

  // 4. Upsert the contact — the SUCCESS GATE. On failure, fail the route (PII-free).
  try {
    await upsertLeadContact(contact);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[/api/lead] contact upsert failed: ${detail}`);
    return NextResponse.json(
      { ok: false, error: "lead_failed" },
      { status: 502 },
    );
  }

  // 5. BEST-EFFORT: re-assemble → render PDF → e-mail with the PDF attached. Any
  //    failure (incl. the pre-DNS `noreply@` sender rejection) is logged and
  //    swallowed — the lead is captured, so the confirmation must still render.
  try {
    const result = (body as { result?: unknown }).result as AssessmentResult;
    const model = assembleReport(result, lang);
    const pdf = await renderReportPdf(model, { city: values.city, lang });
    const bookingHref = buildBookingHref(resolveBookingUrl(), values.city);
    const { subject, html, text } = buildReportEmail({
      parentFirstName: values.parentFirstName,
      bookingHref,
      lang,
    });
    await sendReportEmail({
      to: { email: values.email, name: values.parentFirstName },
      subject,
      html,
      text,
      pdf,
    });
  } catch (err) {
    // Structured, PII-free: our error messages carry endpoint/status/code only.
    const detail = err instanceof Error ? err.message : "unknown";
    console.error(`[/api/lead] report e-mail skipped (best-effort): ${detail}`);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
