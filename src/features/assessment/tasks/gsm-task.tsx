"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { GsmItem } from "@/features/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { corsiResponse, type ResponseFields } from "./view";

// Gsm — Memory (Corsi span, calibration v2). Watch a sequence flash on the
// board (6 tiles at ages 5–6, the canonical 9-tile Corsi layout from 7; 700 ms
// highlight + 400 ms ISI from item.meta), then tap it back — forward, or
// reversed for backward. The child controls when the flash starts ("Покажи
// ми"); tap order is captured verbatim, so backward is judged by the engine,
// not pre-reversed here.
//
// The highlight state uses SCALE + a glow ring + a fill change — never colour
// alone (a11y). The board is a backdrop SVG for the flash visuals + real
// <button> tiles for the taps, so the only control for answering this scored
// task is keyboard-operable, named, and focus-visible.

type Phase = "ready" | "watch" | "input";

export function GsmTask({
  item,
  onAnswer,
}: {
  item: GsmItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const t = useTranslations("task");
  const tc = useTranslations("common");
  const ta = useTranslations("a11y");
  const { tiles, sequence } = item.stimulus;
  const { presentationMs, isiMs } = item.meta;
  // The young 6-tile board keeps larger tiles (≥72px); the 9-tile board stays
  // ≥48px — the age-banded UX minimums ride on the board size.
  const young = tiles.length <= 6;
  const half = young ? 9 : 7.5;
  const minTap = young ? 72 : 48;

  const [phase, setPhase] = React.useState<Phase>("ready");
  const [active, setActive] = React.useState<number | null>(null);
  const [taps, setTaps] = React.useState<number[]>([]);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  React.useEffect(() => clearTimers, []);

  const play = () => {
    clearTimers();
    setTaps([]);
    setPhase("watch");
    let at = 400;
    sequence.forEach((tile) => {
      timers.current.push(setTimeout(() => setActive(tile), at));
      timers.current.push(
        setTimeout(() => setActive(null), at + presentationMs),
      );
      at += presentationMs + isiMs;
    });
    timers.current.push(
      setTimeout(() => {
        setActive(null);
        setPhase("input");
      }, at),
    );
  };

  const tapTile = (i: number) => {
    if (phase !== "input" || taps.length >= sequence.length) return;
    setTaps((prev) => [...prev, i]);
  };

  const remaining = sequence.length - taps.length;
  const full = taps.length === sequence.length;
  const tapRank = (i: number): number | null => {
    const pos = taps.indexOf(i);
    return pos === -1 ? null : pos + 1;
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        className="relative mx-auto aspect-square w-full max-w-[320px] rounded-card border border-border bg-bg"
        role="group"
        aria-label={ta("board")}
      >
        {/* backdrop tiles (flash visuals only) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {tiles.map((tile, i) => {
            const isActive = active === i;
            const rank = tapRank(i);
            const h = isActive ? half * 1.18 : half; // scale on highlight
            return (
              <g key={i}>
                {isActive && (
                  // glow ring — the highlight is never colour alone
                  <rect
                    x={tile.x - h - 2.4}
                    y={tile.y - h - 2.4}
                    width={(h + 2.4) * 2}
                    height={(h + 2.4) * 2}
                    rx={5.5}
                    fill="none"
                    stroke="#00B9AD"
                    strokeOpacity={0.35}
                    strokeWidth={3.5}
                  />
                )}
                <rect
                  x={tile.x - h}
                  y={tile.y - h}
                  width={h * 2}
                  height={h * 2}
                  rx={4}
                  fill={isActive ? "#00B9AD" : rank ? "#D2F3F0" : "#FFFFFF"}
                  stroke={isActive ? "#007D75" : rank ? "#00B9AD" : "#EAE6E0"}
                  strokeWidth={isActive ? 2 : 1.2}
                />
                {rank && (
                  <text
                    x={tile.x}
                    y={tile.y + 3.5}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={700}
                    fill="#007D75"
                  >
                    {rank}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* real tap targets — keyboard-operable, named, focus-visible */}
        {tiles.map((tile, i) => (
          <button
            key={i}
            type="button"
            disabled={phase !== "input"}
            onClick={() => tapTile(i)}
            aria-label={ta("tile", { n: i + 1 })}
            aria-pressed={tapRank(i) != null}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-md",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-focus",
              phase === "input" ? "cursor-pointer" : "pointer-events-none",
            )}
            style={{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: `${half * 2}%`,
              height: `${half * 2}%`,
              minWidth: minTap,
              minHeight: minTap,
            }}
          />
        ))}
      </div>

      {phase === "ready" && (
        <Button onClick={play} className="min-w-44">
          {t("gsmStart")}
        </Button>
      )}
      {phase === "watch" && (
        <p className="text-body text-muted" role="status">
          {t("gsmWatch")}
        </p>
      )}
      {phase === "input" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-body text-muted" role="status">
            {full ? t("gsmYourTurn") : t("gsmTapsLeft", { count: remaining })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setTaps([])}
              disabled={taps.length === 0}
            >
              {tc("again")}
            </Button>
            <Button
              onClick={() => onAnswer(corsiResponse(taps))}
              disabled={!full}
              className="min-w-36"
            >
              {tc("confirm")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
