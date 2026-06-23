"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { isGfMatrix, type GfItem, type MatrixCell } from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import { CountedShape } from "./glyphs";
import { choiceResponse, type ResponseFields } from "./view";

// Gf — Logic. Matrix reasoning (N×N grid with one blank) or numeric series. Four
// options; select then confirm. Options render in the generator's order, so the
// chosen position maps straight to the answer key (no re-shuffle in the view).

function MatrixCellGlyph({ cell, size }: { cell: MatrixCell; size?: number }) {
  return (
    <CountedShape
      kind={cell.shape}
      count={cell.count}
      colorIndex={cell.colorIndex}
      rotation={cell.rotation}
      glyphSize={size}
    />
  );
}

function CellBox({
  children,
  blank,
}: {
  children?: React.ReactNode;
  blank?: boolean;
}) {
  return (
    <div
      className={
        "flex aspect-square items-center justify-center rounded-card border " +
        (blank
          ? "border-2 border-dashed border-border-pur bg-tint-pur/40 text-2xl font-bold text-pur"
          : "border-border bg-surface")
      }
    >
      {blank ? "?" : children}
    </div>
  );
}

export function GfTask({
  item,
  onAnswer,
}: {
  item: GfItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const t = useTranslations("common");
  const [selected, setSelected] = React.useState<number | null>(null);

  const commit = () => {
    if (selected != null) onAnswer(choiceResponse("gf", selected));
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Stimulus */}
      {isGfMatrix(item) ? (
        <div
          className="grid w-full max-w-xs gap-2"
          style={{
            gridTemplateColumns: `repeat(${item.stimulus.size}, minmax(0, 1fr))`,
          }}
        >
          {item.stimulus.cells.map((cell, i) => (
            <CellBox key={i} blank={cell === null}>
              {cell && <MatrixCellGlyph cell={cell} size={28} />}
            </CellBox>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {item.stimulus.terms.map((n, i) => (
            <span
              key={i}
              className="flex min-h-14 min-w-14 items-center justify-center rounded-card border border-border bg-surface px-3 text-2xl font-bold text-ink"
            >
              {n}
            </span>
          ))}
          <span className="flex min-h-14 min-w-14 items-center justify-center rounded-card border-2 border-dashed border-border-pur bg-tint-pur/40 px-3 text-2xl font-bold text-pur">
            ?
          </span>
        </div>
      )}

      {/* Options */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
        {isGfMatrix(item)
          ? item.options.map((cell, i) => (
              <AnswerOption
                key={i}
                selected={selected === i}
                onSelect={() => setSelected(i)}
                aria-label={`Опција ${i + 1}`}
              >
                <MatrixCellGlyph cell={cell} size={26} />
              </AnswerOption>
            ))
          : item.options.map((n, i) => (
              <AnswerOption
                key={i}
                selected={selected === i}
                onSelect={() => setSelected(i)}
                aria-label={`${n}`}
              >
                <span className="text-2xl font-bold text-ink">{n}</span>
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
