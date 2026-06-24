/**
 * Client write path for the anonymous score (Phase 2.01).
 *
 * Builds the no-PII row with the pure `buildScoreRow` and POSTs it to
 * `/api/score`. This is intentionally DECOUPLED from the lead path: it shares no
 * key with the Brevo lead, and a failure here must never block the parent's
 * confirmation or PDF (spec §14.1). The browser never touches Supabase directly.
 */

import type { AssessmentResult } from "@/features/scoring";
import {
  buildScoreRow,
  type ScoreDemographics,
} from "@/features/scoring/persist";

const SCORE_ENDPOINT = "/api/score";

/**
 * POST the anonymous row. Rejects on a non-2xx response so callers can log; the
 * fire-and-forget `writeScore` wrapper is what the flow uses.
 */
export async function postScore(
  result: AssessmentResult,
  demographics: ScoreDemographics,
): Promise<void> {
  const row = buildScoreRow(result, demographics);
  const response = await fetch(SCORE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
    // Let the request finish even if the user navigates away from confirmation.
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(`score write failed: ${response.status}`);
  }
}

/**
 * Fire-and-forget, error-safe score write — the `writeScore` collaborator handed
 * to `runLeadSubmit`. Returns immediately; swallows any failure (the server logs
 * it, PII-free) so the confirmation + PDF are never blocked.
 */
export function writeScore(
  result: AssessmentResult,
  demographics: ScoreDemographics,
): void {
  void postScore(result, demographics).catch(() => {
    // Non-blocking by contract — see spec §14.1. Server-side logs the failure.
  });
}
