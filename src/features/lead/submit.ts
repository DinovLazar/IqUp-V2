/**
 * Lead-submit seam (resolved-decision 4). `submitLead` is the single orchestrator
 * the Part-2 API route owns; in Part 1 it performs NO network call and resolves a
 * typed success. `runLeadSubmit` is the pure, dependency-injected pipeline the
 * form's submit handler delegates to (so the order — persist, then track, then
 * advance — is unit-testable without a DOM).
 *
 * Nothing here leaves the browser in Part 1. No keys, no clients.
 */

import type { AssessmentResult } from "@/features/scoring";
import type { ScoreDemographics } from "@/features/scoring/persist";
import type { LeadFormValues } from "./schema";
import type { trackEvent } from "@/lib/analytics";

/** What a (future) submit resolves to. Widened in Part 2 (e.g. a Brevo id). */
export interface SubmitLeadResult {
  ok: true;
}

/**
 * The active assessment UI language (Feat-Serbian-Localization). The form passes
 * the active next-intl locale ("mk" | "sr"); it is stored with the anonymous score
 * row (a coarse demographic, Store A) and sent to `/api/lead` so the report + PDF +
 * e-mail render in the same language. Defaults to Macedonian.
 */
export type LeadLocale = "mk" | "sr";

/** The lead-capture endpoint (Phase 2.02). */
const LEAD_ENDPOINT = "/api/lead";

/**
 * Create/update the lead and e-mail the report — now REAL (Phase 2.02).
 *
 * POSTs `{ ...values, result }` to `POST /api/lead`, which validates the fields
 * (the shared `leadSchema`), upserts the parent as a Brevo contact (the SUCCESS
 * GATE), then BEST-EFFORT re-assembles the report, renders the PDF (1.09) and
 * e-mails it with the PDF attached. Rejects on a non-2xx response so the form
 * surfaces an error and the confirmation does NOT render; resolves `{ ok: true }`
 * on success.
 *
 * Still deferred to 2.03: the server-side Meta `Lead` (CAPI, `event_id` dedup) +
 * GA4 `lead_submit` — the route is structured so 2.03 can add them after the
 * upsert without re-plumbing this seam. The anonymous score write stays the
 * SEPARATE, non-blocking `writeScore` → `/api/score` step (2.01); it is NOT part
 * of this call, and the two stores never join (spec Дел 14.1).
 */
export async function submitLead(
  values: LeadFormValues,
  result: AssessmentResult,
  locale: LeadLocale = "mk",
): Promise<SubmitLeadResult> {
  const response = await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, result, locale }),
  });
  if (!response.ok) {
    throw new Error(`lead submit failed: ${response.status}`);
  }
  return { ok: true };
}

/** The injectable collaborators of the submit pipeline (real in the form, spied in tests). */
export interface LeadSubmitDeps {
  submit: (
    values: LeadFormValues,
    result: AssessmentResult,
    locale: LeadLocale,
  ) => Promise<SubmitLeadResult>;
  /**
   * Write the anonymous score row — a SEPARATE, non-blocking step decoupled from
   * the lead (no shared key; spec §14.1). Fire-and-forget: returns void and must
   * never throw or block. Its own failures are swallowed (logged server-side).
   */
  writeScore: (
    result: AssessmentResult,
    demographics: ScoreDemographics,
  ) => void;
  track: typeof trackEvent;
  onSubmitted: (values: LeadFormValues) => void;
}

/**
 * The submit pipeline. In order:
 *   1. Fire the anonymous score write — independent of the lead, non-blocking,
 *      and guarded so even a synchronous throw can never reach the confirmation
 *      (spec §14.1: the two stores are decoupled; a score failure must not affect
 *      the parent's confirmation or PDF). It carries ONLY coarse demographics —
 *      no name/e-mail/phone, and no key that ties back to the lead.
 *   2. Persist the lead (Brevo/CAPI/PDF in Part 2; inert stub in Part 1).
 *   3. Fire `lead_submit` (city only — no PII) and advance the flow.
 *
 * Pure orchestration over injected deps so order + arguments are testable in Node.
 */
export async function runLeadSubmit(
  values: LeadFormValues,
  result: AssessmentResult,
  locale: LeadLocale,
  deps: LeadSubmitDeps,
): Promise<void> {
  // 1. Anonymous score write — separate + non-blocking. Belt-and-suspenders: the
  //    real `writeScore` is fire-and-forget + self-catching, and this try/catch
  //    guards against any synchronous throw so confirmation is never blocked.
  try {
    deps.writeScore(result, {
      city: values.city,
      childGender: values.childGender,
      language: locale,
    });
  } catch {
    // Never block the parent on the anonymous score write.
  }

  // 2. Lead path — POSTs to /api/lead in the active locale (report/PDF/e-mail).
  await deps.submit(values, result, locale);

  // 3. Analytics (city only) + advance.
  deps.track("lead_submit", { city: values.city });
  deps.onSubmitted(values);
}
