"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { GvItem } from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import { buildGvView, choiceResponse, type ResponseFields } from "./view";

// Gv — Spatial. Mental rotation (pick the option that is the prompt shape, just
// rotated) or odd-one-out (pick the mirror). Polygons come from `buildGvView`,
// which scales every option by ONE factor so a pure rotation reads as same-size —
// orientation is the only cue. Uniform fill (no colour cue to the answer).

function Polygon({ path, box }: { path: string; box: number }) {
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      width="100%"
      height="100%"
      role="presentation"
      aria-hidden
      className="max-h-28 max-w-28"
    >
      <polygon
        points={path}
        fill="#00B6F1"
        fillOpacity={0.85}
        stroke="#0090C4"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GvTask({
  item,
  onAnswer,
}: {
  item: GvItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const t = useTranslations("common");
  const [selected, setSelected] = React.useState<number | null>(null);
  const view = React.useMemo(() => buildGvView(item), [item]);

  const commit = () => {
    if (selected != null) onAnswer(choiceResponse("gv", selected));
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {view.prompt && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-28 items-center justify-center rounded-card border border-border bg-surface p-2">
            <Polygon path={view.prompt.path} box={view.box} />
          </div>
        </div>
      )}

      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
        {view.options.map((opt) => (
          <AnswerOption
            key={opt.index}
            selected={selected === opt.index}
            onSelect={() => setSelected(opt.index)}
            aria-label={`Опција ${opt.index + 1}`}
            className="aspect-square p-2"
          >
            <Polygon path={opt.path} box={view.box} />
          </AnswerOption>
        ))}
      </div>

      <Button
        onClick={commit}
        disabled={selected === null}
        className="min-w-44"
      >
        {t("confirm")}
      </Button>
    </div>
  );
}
