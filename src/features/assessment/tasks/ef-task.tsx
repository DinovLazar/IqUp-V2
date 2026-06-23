"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { EfItem, TowerMove, TowerState } from "@/features/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { towerResponse, type ResponseFields } from "./view";

// EF — Planning (Tower of London). 3 pegs (caps 3/2/1), 3 balls. Tap a peg to
// lift its top ball, tap another to drop it (only where capacity allows) — each
// drop is one recorded move. Reach the goal → auto-submit the move list; "Доста"
// submits an unsolved attempt so a stuck child can move on. Correctness is
// goal-reached (engine replays the moves), never optimality.

const BALL_COLORS = ["#EC008C", "#00B6F1", "#F7941D"];

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
      className="rounded-full border border-black/10"
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
  onClick,
  index,
}: {
  balls: number[];
  capacity: number;
  ballSize?: number;
  selectable?: boolean;
  lifted?: boolean;
  onClick?: () => void;
  index?: number;
}) {
  const slots = Array.from({ length: capacity }, (_, i) => balls[i]);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `Столбче ${(index ?? 0) + 1}` : undefined}
      className={cn(
        "flex flex-col-reverse items-center gap-1 rounded-card border-2 px-2 pt-2 pb-1",
        onClick
          ? "cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
          : "",
        lifted ? "border-pur bg-tint-pur" : "border-border bg-surface",
        selectable && !lifted && "border-dashed border-border-pur",
      )}
      style={{ minHeight: capacity * (ballSize + 6) + 18 }}
    >
      <span className="mt-1 h-1.5 w-10 rounded-full bg-border" aria-hidden />
      {slots.map((ball, i) =>
        ball === undefined ? (
          <span
            key={i}
            className="rounded-full border border-dashed border-border"
            style={{ width: ballSize, height: ballSize }}
            aria-hidden
          />
        ) : (
          <Ball key={i} id={ball} size={ballSize} />
        ),
      )}
    </Tag>
  );
}

export function EfTask({
  item,
  onAnswer,
}: {
  item: EfItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const t = useTranslations("task");
  const caps = item.stimulus.pegCapacities;

  const [pegs, setPegs] = React.useState<TowerState>(() =>
    clone(item.stimulus.start),
  );
  const [held, setHeld] = React.useState<number | null>(null);
  const [moves, setMoves] = React.useState<TowerMove[]>([]);
  const doneRef = React.useRef(false);

  const finish = (m: TowerMove[]) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onAnswer(towerResponse(m));
  };

  const onPeg = (p: number) => {
    if (doneRef.current) return;
    if (held === null) {
      if (pegs[p].length > 0) setHeld(p);
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
    } else if (pegs[p].length > 0) {
      setHeld(p); // dest full → reselect it as the new source
    }
  };

  const reset = () => {
    setPegs(clone(item.stimulus.start));
    setHeld(null);
    setMoves([]);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Goal reference */}
      <div className="flex flex-col items-center gap-1 rounded-card border border-border-pur bg-tint-pur/50 px-4 py-2">
        <span className="text-label text-pur">{t("efGoal")}</span>
        <div className="flex items-end gap-3">
          {item.stimulus.goal.map((balls, i) => (
            <Peg key={i} balls={balls} capacity={caps[i]} ballSize={16} />
          ))}
        </div>
      </div>

      <p className="text-body text-muted">{t("efPick")}</p>

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
            onClick={() => onPeg(i)}
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
