"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { GsItem } from "@/features/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SymbolGlyph } from "./glyphs";
import { searchResponse, type ResponseFields } from "./view";

// Gs — Processing speed (symbol search). THE ONE task with a visible timer: a
// calm orange ring that depletes over the 20–25 s window (brand §5.2 — never a
// red counting-down number, no flashing). Tap every cell holding the target
// symbol; on timeout the current selection auto-submits. Selected cells map
// straight to the answer key — time only feeds the Gs *score*, never correctness.

function CountdownRing({ fraction }: { fraction: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" width={48} height={48} aria-hidden>
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke="#FDEBD3"
        strokeWidth={6}
      />
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        stroke="#F7941D"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, fraction)))}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

export function GsTask({
  item,
  onAnswer,
}: {
  item: GsItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const t = useTranslations("task");
  const { cells, columns, targets } = item.stimulus;
  const windowMs = item.meta.windowSec[1] * 1000;

  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [remainingMs, setRemainingMs] = React.useState(windowMs);
  const selectedRef = React.useRef(selected);
  React.useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  const doneRef = React.useRef(false);

  const submit = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onAnswer(searchResponse([...selectedRef.current].sort((a, b) => a - b)));
  }, [onAnswer]);

  React.useEffect(() => {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const id = setInterval(() => {
      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        start;
      const left = Math.max(0, windowMs - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(id);
        submit();
      }
    }, 100);
    return () => clearInterval(id);
  }, [windowMs, submit]);

  const toggle = (i: number) => {
    if (doneRef.current) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Target legend + the (only) visible timer */}
      <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-card border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-label text-muted">{t("gsFind")}</span>
          <span className="flex gap-2">
            {targets.map((sym) => (
              <span
                key={sym}
                className="flex size-11 items-center justify-center rounded-card bg-tint-pur"
              >
                <SymbolGlyph id={sym} size={32} color="#762D90" />
              </span>
            ))}
          </span>
        </div>
        <div
          className="flex flex-col items-center"
          role="timer"
          aria-label={t("gsTimeLeft")}
        >
          <CountdownRing fraction={remainingMs / windowMs} />
        </div>
      </div>

      {/* The grid */}
      <div
        className="grid w-full max-w-md gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((sym, i) => {
          const isSel = selected.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-label={`Поле ${i + 1}`}
              aria-pressed={isSel}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border-2",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-focus",
                isSel
                  ? "border-pur bg-tint-pur"
                  : "border-border bg-surface hover:border-border-pur",
              )}
            >
              <SymbolGlyph
                id={sym}
                size={26}
                color={isSel ? "#762D90" : "#231F26"}
              />
            </button>
          );
        })}
      </div>

      <Button onClick={submit} className="min-w-44">
        {t("gsDone")}
      </Button>
    </div>
  );
}
