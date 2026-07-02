"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { GlrItem } from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GlrGlyph } from "./glyphs";
import { recallResponse, type ResponseFields } from "./view";

// Glr — Learning (paired-associate, calibration v2). Study K cue↔target pairs,
// then recall them over N rounds (N = the item's ladder-row `trials`). The v2
// symbol styles decode from the pair ids: pictorial nameable objects (sun,
// house, fish, …) for the younger levels, brand-styled abstract glyph sets for
// the older ones, mixed in between — two visually distinct families so the
// PAIRING is what's learned. Each round re-presents the same trials; the
// per-round picks feed the learning slope in scoring.

export function GlrTask({
  item,
  onAnswer,
  rounds,
}: {
  item: GlrItem;
  onAnswer: (fields: ResponseFields) => void;
  rounds?: number;
  practice?: boolean;
}) {
  const t = useTranslations("task");
  const ta = useTranslations("a11y");
  const trials = item.stimulus.trials;
  const totalRounds = rounds ?? item.meta.trials;

  const [phase, setPhase] = React.useState<"study" | "recall">("study");
  const [round, setRound] = React.useState(0);
  const [trial, setTrial] = React.useState(0);
  const picksRef = React.useRef<number[][]>([]);
  const currentRef = React.useRef<number[]>([]);

  const pick = (optionIndex: number) => {
    currentRef.current.push(optionIndex);
    const isLastTrial = trial >= trials.length - 1;
    if (!isLastTrial) {
      setTrial((x) => x + 1);
      return;
    }
    // Round complete.
    picksRef.current.push(currentRef.current);
    currentRef.current = [];
    if (round >= totalRounds - 1) {
      onAnswer(recallResponse(picksRef.current));
      return;
    }
    setRound((r) => r + 1);
    setTrial(0);
  };

  if (phase === "study") {
    return (
      <div className="flex w-full flex-col items-center gap-5">
        <p className="text-body text-muted">{t("glrStudy")}</p>
        <div className="grid w-full max-w-sm grid-cols-1 gap-2.5">
          {item.stimulus.pairs.map((pair, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-4 rounded-card border border-border bg-surface px-4 py-2.5"
            >
              <GlrGlyph id={pair.cue} size={40} />
              <ArrowRight className="size-5 text-muted" aria-hidden />
              <GlrGlyph id={pair.target} size={40} />
            </div>
          ))}
        </div>
        <Button onClick={() => setPhase("recall")} className="min-w-44">
          {t("glrStudyDone")}
        </Button>
      </div>
    );
  }

  const current = trials[trial];
  const cols = Math.min(current.options.length, 4);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <span className="text-label text-muted">
        {t("glrRound", { current: round + 1, total: totalRounds })}
      </span>
      <p className="text-body text-muted">{t("glrRecall")}</p>

      <div className="flex size-24 items-center justify-center rounded-card border-2 border-border-pur bg-tint-pur/50">
        <GlrGlyph id={current.cue} size={56} />
      </div>

      <div
        className="grid w-full max-w-md gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {current.options.map((target, i) => (
          <AnswerOption
            key={i}
            onSelect={() => pick(i)}
            aria-label={ta("option", { n: i + 1 })}
            className="aspect-square"
          >
            <GlrGlyph id={target} size={44} />
          </AnswerOption>
        ))}
      </div>
    </div>
  );
}
