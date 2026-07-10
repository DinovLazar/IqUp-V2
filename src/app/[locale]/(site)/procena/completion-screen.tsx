"use client";

import { useTranslations } from "next-intl";

import { PuzzleBrain } from "@/components/ui/puzzle-brain";
import { RewardBadge } from "@/components/ui/reward-badge";
import { Button } from "@/components/ui/button";

// Completion — the whole puzzle-brain assembled + the "IQ UP! Истражувач" reward
// (handover §4.2 / §2). The child's badge stays as-is; `onProceed` adds the
// parent-facing affordance to continue to the lead form (Phase 1.08,
// resolved-decision 2). NOTHING is persisted before the form.
export function CompletionScreen({ onProceed }: { onProceed?: () => void }) {
  const t = useTranslations("complete");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <PuzzleBrain completed={5} showTrack={false} />
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-ink">{t("title")}</h1>
        <p className="text-body text-muted">{t("body")}</p>
      </div>
      <RewardBadge
        title={t("rewardTitle")}
        line={t("rewardLine")}
        className="w-full max-w-xs"
      />
      {onProceed && (
        <Button size="lg" onClick={onProceed} className="w-full max-w-xs">
          {t("toForm")}
        </Button>
      )}
    </div>
  );
}
