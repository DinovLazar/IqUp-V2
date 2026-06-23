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
import type { LeadFormValues } from "./schema";
import type { trackEvent } from "@/lib/analytics";

/** What a (future) submit resolves to. Widened in Part 2 (e.g. a Brevo id). */
export interface SubmitLeadResult {
  ok: true;
}

/**
 * Create/update the lead and kick off everything that follows. **Part 1: inert.**
 *
 * Part 2 contract (Phase 2.02 / 2.03) — this function will own, in order:
 *   1. Create/update the Brevo lead from `values` (name/email/phone/city +
 *      marketing-consent flag).
 *   2. Fire Meta `Lead` (CAPI, with an `event_id` for client/server dedup) and
 *      GA4 `lead_submit`.
 *   3. Generate the branded PDF (Phase 1.09) and email it via Brevo. The PDF is
 *      NEVER stored (spec Дел 14).
 *   4. SEPARATELY write the anonymous score row from `result` (date only, no
 *      PII). The two stores must NEVER be joinable (spec Дел 14.1) — this is why
 *      the score write lives behind the same seam but as an independent step,
 *      keyed by nothing that ties back to the lead.
 *
 * None of those bodies exist yet — only the seam, its types, and the call site.
 */
export async function submitLead(
  values: LeadFormValues,
  result: AssessmentResult,
): Promise<SubmitLeadResult> {
  // Intentionally no network in Part 1. Referenced so the contract is explicit.
  void values;
  void result;
  return { ok: true };
}

/** The injectable collaborators of the submit pipeline (real in the form, spied in tests). */
export interface LeadSubmitDeps {
  submit: (
    values: LeadFormValues,
    result: AssessmentResult,
  ) => Promise<SubmitLeadResult>;
  track: typeof trackEvent;
  onSubmitted: (values: LeadFormValues) => void;
}

/**
 * The submit pipeline: persist the lead, then fire `lead_submit` (city only — no
 * PII), then advance the flow. Pure orchestration over injected deps so the call
 * order and arguments are testable in Node.
 */
export async function runLeadSubmit(
  values: LeadFormValues,
  result: AssessmentResult,
  deps: LeadSubmitDeps,
): Promise<void> {
  await deps.submit(values, result);
  deps.track("lead_submit", { city: values.city });
  deps.onSubmitted(values);
}
