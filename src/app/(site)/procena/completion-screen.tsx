"use client";

import { useTranslations } from "next-intl";

import { PuzzleBrain } from "@/components/ui/puzzle-brain";
import { RewardBadge } from "@/components/ui/reward-badge";

// Completion — the whole puzzle-brain assembled + the "IQ UP! Истражувач" reward
// (handover §4.2 / §2). This phase ends here: NOTHING is persisted before the
// (not-yet-built) lead form (1.08); the report itself is 1.07.
export function CompletionScreen() {
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
    </div>
  );
}
