"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { uxForAge } from "@/content/tasks/levels";
import type { EfItem, TowerMove, TowerState } from "@/features/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { towerResponse, type ResponseFields } from "./view";

// EF — Planning (Tower of London, calibration v2). A proper board: three pegs
// with VISIBLE capacity (rod heights 3/2/1), three balls in magenta/blue/yellow
// (the colourblind-safer set), a compact goal-state card always visible, tap-
// source-then-destination interaction, an illegal-move SHAKE that does not
// count as a move (reduced-motion aware), and a visible move counter. No timer.
// Reach the goal → auto-submit the move list; "Доста" submits an unsolved
// attempt so a stuck child can move on. Correctness is goal-reached (the engine
// replays the moves), never optimality.

const BALL_COLORS = ["#EC008C", "#00B6F1", "#FFC20E"];

const clone = (s: TowerState): TowerState => s.map((peg) => peg.slice());
const towerEqual = (a: TowerState, b: TowerState): boolean =>
  a.length === b.length &&
  a.every(
    (peg, i) =>
      peg.length === b[i].length && peg.every((v, j) => v === b[i][j]),
  );

function Ball({ id, size = 30 }: { id: number; size?: number }) {
  return (
    <span
      className="rounded-full border-2 border-black/15"
      style={{
        width: size,
        height: size,
        backgroundColor: BALL_COLORS[id % BALL_COLORS.length],
      }}
      aria-hidden
    />
  );
}

function Peg({
  balls,
  capacity,
  ballSize = 30,
  selectable,
  lifted,
  shaking,
  onClick,
  index,
  label,
  minTap = 44,
}: {
  balls: number[];
  capacity: number;
  ballSize?: number;
  selectable?: boolean;
  lifted?: boolean;
  shaking?: boolean;
  onClick?: () => void;
  index?: number;
  label?: string;
  /** UX_BY_AGE tap minimum, applied to interactive pegs only. */
  minTap?: number;
}) {
  const slots = Array.from({ length: capacity }, (_, i) => balls[i]);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={
        onClick ? (label ?? `Столбче ${(index ?? 0) + 1}`) : undefined
      }
      className={cn(
        "relative flex flex-col-reverse items-center gap-1 rounded-card border-2 px-2 pt-2 pb-1",
        onClick
          ? "cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
          : "",
        lifted ? "border-pur bg-tint-pur" : "border-border bg-surface",
        selectable && !lifted && "border-dashed border-border-pur",
        shaking && "animate-shake",
      )}
      style={{
        minHeight: Math.max(
          capacity * (ballSize + 6) + 26,
          onClick ? minTap : 0,
        ),
        minWidth: onClick ? minTap : undefined,
      }}
    >
      {/* base + rod: the peg's capacity is VISIBLE as the rod height */}
      <span className="mt-1 h-1.5 w-12 rounded-full bg-grey/50" aria-hidden />
      <span
        aria-hidden
        className="absolute bottom-3 left-1/2 w-1 -translate-x-1/2 rounded-full bg-grey/35"
        style={{ height: capacity * (ballSize + 6) }}
      />
      {slots.map((ball, i) =>
        ball === undefined ? (
          <span
            key={i}
            className="z-10 rounded-full border border-dashed border-border"
            style={{ width: ballSize, height: ballSize }}
            aria-hidden
          />
        ) : (
          <span key={i} className="z-10">
            <Ball id={ball} size={ballSize} />
          </span>
        ),
      )}
    </Tag>
  );
}

export function EfTask({
  item,
  onAnswer,
  age,
}: {
  item: EfItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
  age?: number;
}) {
  const minTap = age !== undefined ? uxForAge(age).minTapPx : 44;
  const t = useTranslations("task");
  const ta = useTranslations("a11y");
  const caps = item.stimulus.pegCapacities;

  const [pegs, setPegs] = React.useState<TowerState>(() =>
    clone(item.stimulus.start),
  );
  const [held, setHeld] = React.useState<number | null>(null);
  const [moves, setMoves] = React.useState<TowerMove[]>([]);
  const [shakePeg, setShakePeg] = React.useState<number | null>(null);
  const doneRef = React.useRef(false);
  const shakeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    },
    [],
  );

  const finish = (m: TowerMove[]) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onAnswer(towerResponse(m));
  };

  const shake = (p: number) => {
    setShakePeg(p);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShakePeg(null), 350);
  };

  const onPeg = (p: number) => {
    if (doneRef.current) return;
    if (held === null) {
      if (pegs[p].length > 0) setHeld(p);
      else shake(p); // nothing to pick up
      return;
    }
    if (p === held) {
      setHeld(null);
      return;
    }
    if (pegs[p].length < caps[p]) {
      const next = clone(pegs);
      const ball = next[held].pop() as number;
      next[p].push(ball);
      const nextMoves = [...moves, { from: held, to: p }];
      setPegs(next);
      setMoves(nextMoves);
      setHeld(null);
      if (towerEqual(next, item.stimulus.goal)) finish(nextMoves);
    } else {
      // Illegal move (destination full): shake, keep holding — NOT a move.
      shake(p);
    }
  };

  const reset = () => {
    setPegs(clone(item.stimulus.start));
    setHeld(null);
    setMoves([]);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Goal reference — always visible */}
      <div className="flex flex-col items-center gap-1 rounded-card border border-border-pur bg-tint-pur/50 px-4 py-2">
        <span className="text-label text-pur">{t("efGoal")}</span>
        <div className="flex items-end gap-3">
          {item.stimulus.goal.map((balls, i) => (
            <Peg key={i} balls={balls} capacity={caps[i]} ballSize={16} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-body text-muted">{t("efPick")}</p>
        <span
          className="rounded-badge bg-tint-pur px-3 py-1 text-label font-semibold text-pur"
          role="status"
        >
          {t("efMoves", { count: moves.length })}
        </span>
      </div>

      {/* Interactive board */}
      <div className="flex items-end justify-center gap-4">
        {pegs.map((balls, i) => (
          <Peg
            key={i}
            index={i}
            balls={balls}
            capacity={caps[i]}
            selectable={held !== null && balls.length < caps[i]}
            lifted={held === i}
            shaking={shakePeg === i}
            onClick={() => onPeg(i)}
            label={ta("peg", { n: i + 1 })}
            minTap={minTap}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={reset} disabled={moves.length === 0}>
          {t("efReset")}
        </Button>
        <Button variant="secondary" onClick={() => finish(moves)}>
          {t("efGiveUp")}
        </Button>
      </div>
    </div>
  );
}
