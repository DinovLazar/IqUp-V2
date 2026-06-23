"use client";

import type { EndPhase } from "@/features/assessment";
import type { AssessmentResult } from "@/features/scoring";
import type { LeadFormValues } from "@/features/lead";
import { CompletionScreen } from "./completion-screen";
import { LeadForm } from "./lead-form";
import { Confirmation } from "./confirmation";

// The post-assessment screen switch (Phase 1.08), split out of the flow machine so
// the completion → form → confirmation wiring is testable in isolation. The guards
// are deliberate: the form needs the scored `result`; the confirmation needs both
// the `result` and the submitted `leadValues` (for the booking `?grad={city}`). A
// missing prerequisite falls back to completion rather than rendering a half-built
// screen.
export function EndPhaseView({
  endPhase,
  result,
  leadValues,
  onProceed,
  onSubmitted,
  onRestart,
}: {
  endPhase: EndPhase;
  result: AssessmentResult | null;
  leadValues: LeadFormValues | null;
  onProceed: () => void;
  onSubmitted: (values: LeadFormValues) => void;
  onRestart: () => void;
}) {
  if (endPhase === "form" && result) {
    return <LeadForm result={result} onSubmitted={onSubmitted} />;
  }
  if (endPhase === "confirmation" && result && leadValues) {
    return (
      <Confirmation
        result={result}
        city={leadValues.city}
        onRestart={onRestart}
      />
    );
  }
  return <CompletionScreen onProceed={onProceed} />;
}
