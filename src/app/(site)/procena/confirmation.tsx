"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, Sparkles, Star } from "lucide-react";

import type { AssessmentResult } from "@/features/scoring";
import { assembleReport, selectReportSummary } from "@/features/report";
import {
  buildBookingHref,
  resolveBookingUrl,
  type LeadFormValues,
} from "@/features/lead";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { IndexBandBar } from "@/components/ui/index-band-bar";
import { Pentagon } from "@/components/ui/pentagon";

// Confirmation (Phase 1.08) — the final flow phase, spec Дел 10.1. It renders the
// ON-SCREEN SUMMARY ONLY (pentagon + the five band rows + the top strength), the
// "report sent to email" line, the §D.2 data note, the §D.4 disclaimer
// placeholder, and the booking CTA with `?grad={city}`. NO hard number anywhere —
// word bands + indicative ranges only (Дел 10.2). The full report (growth,
// activities, STEM bridge, positioning) lives only in the emailed PDF (1.09).
//
// A strong-validity flag yields the graceful-retry variant (no confident
// profile, Дел 7.1) — the same content `selectReportSummary` carries.

export interface ConfirmationProps {
  /** The scored session — assembled into the report once, here. */
  result: AssessmentResult;
  /** Submitted city — drives the booking link + `lead_submit`/CTA params. */
  city: LeadFormValues["city"];
  /** Restart the assessment (used by the graceful-retry variant). */
  onRestart?: () => void;
}

export function Confirmation({ result, city, onRestart }: ConfirmationProps) {
  const t = useTranslations("confirmation");
  const tl = useTranslations("legal");

  // Deterministic: assemble once, then project to the on-screen subset.
  const summary = React.useMemo(
    () => selectReportSummary(assembleReport(result)),
    [result],
  );

  if (summary.variant === "retry") {
    return (
      <RetryView
        title={t("retryTitle")}
        note={summary.validity.note ?? t("retryNote")}
        retryLabel={t("retry")}
        disclaimer={tl("disclaimer")}
        onRestart={onRestart}
      />
    );
  }

  const indices = summary.indices ?? [];
  const bookingHref = buildBookingHref(resolveBookingUrl(), city);
  const ctaText = summary.cta?.text ?? t("ctaFallback");

  return (
    <div className="flex flex-1 flex-col gap-6 py-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="flex items-start gap-2 text-body text-ink">
          <Sparkles className="mt-1 size-4 shrink-0 text-pur" aria-hidden />
          {t("emailSent")}
        </p>
        <p className="text-body text-muted">{t("summaryIntro")}</p>
      </div>

      {/* Pentagon + the five band rows (word + indicative range; no number). */}
      <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-5 md:flex-row md:items-start">
        <div className="flex shrink-0 justify-center">
          <Pentagon values={indices.map((i) => i.value)} size={240} />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          {indices.map((i) => (
            <IndexBandBar
              key={i.key}
              indexKey={i.key}
              band={i.band}
              range={i.range}
              confidence={i.confidence}
            />
          ))}
        </div>
      </div>

      {/* Top strength (the only narrative block shown on-screen, Дел 10.1). */}
      {summary.topStrength && (
        <div className="flex flex-col gap-1">
          <h2 className="text-label text-ink">{t("strengthTitle")}</h2>
          <p className="text-body text-muted">{summary.topStrength.text}</p>
        </div>
      )}

      {/* §D.2 data note. */}
      <p className="rounded-field border border-border bg-bg p-3 text-label font-normal text-muted">
        {tl("dataNote")}
      </p>

      {/* Booking CTA — links out as {bookingUrl}?grad={city}. */}
      <div className="flex flex-col gap-2 rounded-card border border-border-pur bg-tint-pur/40 p-5">
        <h2 className="text-subhead text-ink">{t("ctaTitle")}</h2>
        <div>
          <Button asChild size="lg">
            <a
              href={bookingHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("cta_booking_click", {
                  city,
                  source: "confirmation",
                })
              }
            >
              <Star aria-hidden /> {ctaText}
            </a>
          </Button>
        </div>
      </div>

      {/* §D.4 disclaimer placeholder — the shared 7-placement component is 1.10. */}
      <p className="text-label font-normal text-muted">{tl("disclaimer")}</p>
    </div>
  );
}

/** Graceful-retry view — strong validity flag, no confident profile (Дел 7.1). */
function RetryView({
  title,
  note,
  retryLabel,
  disclaimer,
  onRestart,
}: {
  title: string;
  note: string;
  retryLabel: string;
  disclaimer: string;
  onRestart?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-2">
      <div className="flex flex-col gap-4 rounded-card border border-border-pur bg-tint-pur/40 p-5">
        <h1 className="text-subhead text-ink">{title}</h1>
        <p className="text-body text-muted">{note}</p>
        {onRestart && (
          <div>
            <Button variant="secondary" onClick={onRestart}>
              <RotateCcw aria-hidden /> {retryLabel}
            </Button>
          </div>
        )}
      </div>
      <p className="text-label font-normal text-muted">{disclaimer}</p>
    </div>
  );
}
