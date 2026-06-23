"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { GlrItem, ShapeKind } from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ShapeGlyph, SymbolGlyph } from "./glyphs";
import { recallResponse, type ResponseFields } from "./view";

// Glr — Learning (paired-associate). Study K cue↔target pairs, then recall them
// over N rounds (N from the engine action: 2 under age 9, 3 from 9). Cues are
// filled shapes, targets are outline symbols — two distinct families so the
// pairing is what's learned. Each round re-presents the same trials; the per-round
// picks feed the learning slope in scoring.

const SHAPES: readonly ShapeKind[] = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "hexagon",
  "pentagon",
  "cross",
];

const CueGlyph = ({ id, size = 40 }: { id: number; size?: number }) => (
  <ShapeGlyph
    kind={SHAPES[id % SHAPES.length]}
    colorIndex={id}
    pip={false}
    size={size}
  />
);

export function GlrTask({
  item,
  onAnswer,
  rounds = 2,
}: {
  item: GlrItem;
  onAnswer: (fields: ResponseFields) => void;
  rounds?: number;
  practice?: boolean;
}) {
  const t = useTranslations("task");
  const tc = useTranslations("common");
  const trials = item.stimulus.trials;

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
    if (round >= rounds - 1) {
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
              <CueGlyph id={pair.cue} />
              <ArrowRight className="size-5 text-muted" aria-hidden />
              <SymbolGlyph id={pair.target} size={38} color="#762D90" />
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
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <span className="text-label text-muted">
        {t("glrRound", { current: round + 1, total: rounds })}
      </span>
      <p className="text-body text-muted">{t("glrRecall")}</p>

      <div className="flex size-24 items-center justify-center rounded-card border-2 border-border-pur bg-tint-pur/50">
        <CueGlyph id={current.cue} size={56} />
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
        {current.options.map((target, i) => (
          <AnswerOption
            key={i}
            onSelect={() => pick(i)}
            aria-label={`${tc("confirm")} ${i + 1}`}
            className="aspect-square"
          >
            <SymbolGlyph id={target} size={40} color="#231F26" />
          </AnswerOption>
        ))}
      </div>
    </div>
  );
}
