"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Clock, Lightbulb, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Label } from "@/components/ui/label";

// Pre-start — brief instructions + the MANDATORY 5–7 parent screen (technical
// help, not solving) with its confirmation checkbox, and the shared "informative,
// not diagnostic" line (§16.1 placement #2 — the short `Disclaimer`). Returns
// `parentAssistMode` (true for 5–7) — plumbed through the flow but inert this
// phase (pacing/thresholds are Phase 3.01).
export function PrestartScreen({
  age,
  onStart,
}: {
  age: number;
  onStart: (parentAssistMode: boolean) => void;
}) {
  const t = useTranslations("prestart");
  const needsParent = age <= 7;
  const [confirmed, setConfirmed] = React.useState(false);
  const canStart = !needsParent || confirmed;

  const points = [
    { icon: Lightbulb, text: t("point1") },
    { icon: Sparkles, text: t("point2") },
    { icon: Clock, text: t("point3") },
  ];

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="text-body text-muted">{t("intro")}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {points.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-pur text-pur">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-body text-ink">{text}</span>
          </li>
        ))}
      </ul>

      {needsParent && (
        <Card variant="emphasis" className="gap-3">
          <h2 className="text-subhead text-ink">{t("parentTitle")}</h2>
          <p className="text-body text-ink">{t("parentBody")}</p>
          <div className="flex items-start gap-3">
            <Checkbox
              id="parent-confirm"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />
            <Label
              htmlFor="parent-confirm"
              className="leading-snug font-normal"
            >
              {t("parentConfirm")}
            </Label>
          </div>
          {!confirmed && (
            <p className="text-label font-normal text-muted">
              {t("parentConfirmRequired")}
            </p>
          )}
        </Card>
      )}

      {/* §16.1 placement #2 — the pre-start screen (shared component, short). */}
      <Disclaimer variant="short" />

      <Button
        size="lg"
        disabled={!canStart}
        onClick={() => onStart(needsParent)}
        className="self-start"
      >
        {t("start")}
      </Button>
    </div>
  );
}
