"use client";

import * as React from "react";

import {
  scoreProfile,
  logicStrong,
  strongInvalid,
} from "@/features/assessment/fixtures";
import type { LeadFormValues } from "@/features/lead";
import { LeadForm } from "@/app/[locale]/(site)/procena/lead-form";
import { Confirmation } from "@/app/[locale]/(site)/procena/confirmation";
import { Badge } from "@/components/ui/badge";

/**
 * Dev-only preview (Phase 1.08) of the lead form + confirmation. The form is
 * shown in three states (empty / validation-error / missing-consent) via the
 * preview seams (`autoValidate` runs validation on mount; `defaultValues` seeds
 * fields). The confirmation is rendered from one `fixtures.ts` profile (plus the
 * strong-invalid → graceful-retry variant). `onSubmitted` is a no-op here.
 *
 * Avoid persisting / leaving the browser — same as the rest of /kit.
 */

const noop = () => {};

/** Valid field values (consents intentionally left unticked for the missing-consent state). */
const FILLED: Partial<LeadFormValues> = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "070 123 456",
  city: "Скопје",
};

function Frame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Badge variant="soft">{label}</Badge>
      <div className="rounded-card border border-border bg-bg p-4">
        {children}
      </div>
    </div>
  );
}

export function LeadPreview() {
  // The form needs a scored result for `submitLead`; the confirmation assembles
  // its report from one. Compute once (deterministic).
  const result = React.useMemo(() => scoreProfile(logicStrong), []);
  const retryResult = React.useMemo(() => scoreProfile(strongInvalid), []);

  return (
    <div className="flex flex-col gap-8">
      <Frame label="Форма · празна">
        <LeadForm result={result} onSubmitted={noop} />
      </Frame>

      <Frame label="Форма · грешки при валидација (празно поднесување)">
        <LeadForm result={result} onSubmitted={noop} autoValidate />
      </Frame>

      <Frame label="Форма · валидни полиња, без штиклирани согласности">
        <LeadForm
          result={result}
          onSubmitted={noop}
          defaultValues={FILLED}
          autoValidate
        />
      </Frame>

      <Frame label={`Потврда · профил (${logicStrong.label})`}>
        <Confirmation result={result} city="Скопје" onRestart={noop} />
      </Frame>

      <Frame label="Потврда · graceful-retry (strong-invalid)">
        <Confirmation result={retryResult} city="Скопје" onRestart={noop} />
      </Frame>
    </div>
  );
}
