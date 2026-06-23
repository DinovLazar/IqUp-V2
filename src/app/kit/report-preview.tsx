"use client";

import * as React from "react";
import { Star, RotateCcw, Sparkles } from "lucide-react";

import {
  PROFILES,
  scoreProfile,
  type Profile,
} from "@/features/assessment/fixtures";
import {
  assembleReport,
  deriveFeatures,
  type ReportModel,
} from "@/features/report";
import { Pentagon } from "@/components/ui/pentagon";
import { IndexBandBar } from "@/components/ui/index-band-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/ui/disclaimer";

/**
 * Dev-only report preview (Phase 1.07). Renders all five `fixtures.ts` profiles
 * THROUGH `assembleReport`, so the "5 profiles → 5 distinct reports" criterion is
 * visible to the eye. Layout follows the Phase 1.02 report mockup (§5.3): pentagon
 * + band bars, then strength / growth / style / activities, Part Б, positioning and
 * the dynamic CTA. The strong-invalid fixture renders the graceful-retry variant.
 *
 * MK section headings are hard-coded here (matching the rest of /kit) — the
 * PRODUCTION 1.08 screen routes this chrome through next-intl (resolved-decision 6).
 * The disclaimer now uses the shared `Disclaimer` component (Phase 1.10, full
 * variant) — the single §16.1 source — shown once so the preview stays honest.
 */

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-label text-ink" style={{ letterSpacing: "0.01em" }}>
      {children}
    </h4>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Heading>{title}</Heading>
      <p className="text-body text-muted">{text}</p>
    </div>
  );
}

/** A compact, dev-only line exposing the derived differences at a glance. */
function DebugLine({ profile }: { profile: Profile }) {
  const f = deriveFeatures(scoreProfile(profile));
  return (
    <p className="text-label font-normal text-muted">
      <code>
        top={f.topStrengthIndex} · growth={f.primaryGrowthIndex} · style=
        {f.solvingStyle} · stemLead={f.stemLead} · shape={f.profileShape} ·
        ceiling=
        {String(f.anyCeiling)} · valid={f.validity}
      </code>
    </p>
  );
}

function RetryCard({ report }: { report: ReportModel }) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-pur bg-tint-pur/40 p-5">
      <Badge variant="soft">Невалидна сесија · graceful retry</Badge>
      <p className="text-subhead text-ink">Ајде уште еднаш</p>
      <p className="text-body text-muted">{report.validity.note}</p>
      <div>
        <Button variant="secondary">
          <RotateCcw aria-hidden /> Повтори
        </Button>
      </div>
    </div>
  );
}

function ProfileCard({ report }: { report: ReportModel }) {
  const indices = report.indices ?? [];
  const a = report.partA;
  const b = report.partB;
  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-5">
      {/* Pentagon + band bars (mobile: stacked; desktop: side by side) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
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

      {/* Extreme callout (ceiling / floor) */}
      {a?.extreme && (
        <div className="flex items-start gap-2 rounded-field border border-border-pur bg-tint-pur/40 p-3">
          <Sparkles className="mt-0.5 shrink-0 text-pur" aria-hidden />
          <p className="text-body text-ink">{a.extreme.text}</p>
        </div>
      )}

      {/* Дел А · Когнитивен профил */}
      {a && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Block title="Силна страна" text={a.topStrength.text} />
          <Block title="Област за раст" text={a.growthArea.text} />
          <Block title="Стил на решавање" text={a.solvingStyle.text} />
          <div className="flex flex-col gap-2">
            <Heading>Активности за дома</Heading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {a.activities.map((act) => (
                <div key={act.index} className="flex flex-col gap-1">
                  <span className="text-label text-ink">
                    {indices.find((i) => i.key === act.index)?.label ??
                      act.index}
                  </span>
                  <ul className="list-disc pl-5 text-body text-muted">
                    {act.items.map((item, n) => (
                      <li key={n}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Дел Б · STEM подготвеност */}
      {b && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Block title="STEM подготвеност" text={b.readiness.text} />
          <Block title="Мост кон STEM" text={b.stemBridge.text} />
        </div>
      )}

      {/* Позиционирање + CTA */}
      {report.positioning && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <Block
            title="Како IQ UP! може да помогне"
            text={report.positioning.text}
          />
          <p className="text-label font-normal text-muted">
            Програма (интерно): {report.positioning.program.name} ·{" "}
            {report.positioning.program.tier}
          </p>
          {report.cta && (
            <div>
              <Button>
                <Star aria-hidden /> {report.cta.text}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mild validity note (otherwise-normal report + soft note) */}
      {report.validity.variant === "mild" && report.validity.note && (
        <p className="text-body text-muted">{report.validity.note}</p>
      )}
    </div>
  );
}

export function ReportPreview() {
  return (
    <div className="flex flex-col gap-8">
      {PROFILES.map((profile) => {
        const report = assembleReport(scoreProfile(profile));
        return (
          <div key={profile.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge>{profile.label}</Badge>
              <span className="text-label font-normal text-muted">
                возраст {profile.age} · {report.variant}
              </span>
            </div>
            <DebugLine profile={profile} />
            {report.variant === "retry" ? (
              <RetryCard report={report} />
            ) : (
              <ProfileCard report={report} />
            )}
          </div>
        );
      })}

      {/* Shared §16.1 disclaimer (full) — the single source; shown once here so
          the report preview stays honest. */}
      <Disclaimer
        variant="full"
        className="rounded-field border border-border bg-bg p-3"
      />
    </div>
  );
}
