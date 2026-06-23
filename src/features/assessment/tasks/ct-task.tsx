"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type {
  CtConditionStimulus,
  CtDebugStimulus,
  CtItem,
  CtLoopStimulus,
  CtMazeStimulus,
  CtSequenceStimulus,
  Move,
  Point,
} from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowGlyph, ConditionToken } from "./glyphs";
import {
  ctOptionResponse,
  ctPathResponse,
  ctStepResponse,
  type ResponseFields,
} from "./view";

// CT — STEM (computational thinking). Five symbol-only sub-types, zero text in
// the stimulus (instructions live in i18n chrome). sequence/loop/condition →
// choose an option; debug → tap the broken step; maze → navigate to the goal.
// The maze enforces a simple (no-revisit) walk so a goal-reaching path equals the
// generator's unique solution exactly.

const DELTA: Record<Move, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
const eq = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

// ── Shared bits ────────────────────────────────────────────────────────────────

function ArrowRow({
  moves,
  size = 30,
}: {
  moves: readonly Move[];
  size?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5">
      {moves.map((m, i) => (
        <ArrowGlyph key={i} move={m} size={size} />
      ))}
    </div>
  );
}

function GridBoard({
  size,
  start,
  goal,
  box = 180,
}: {
  size: number;
  start: Point;
  goal: Point;
  box?: number;
}) {
  const cell = box / size;
  const cx = (p: Point) => p.x * cell + cell / 2;
  const cy = (p: Point) => p.y * cell + cell / 2;
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      width="100%"
      className="max-w-[220px] rounded-card border border-border bg-bg"
      role="img"
      aria-label="Мрежа"
    >
      {Array.from({ length: size + 1 }, (_, i) => (
        <React.Fragment key={i}>
          <line
            x1={i * cell}
            y1={0}
            x2={i * cell}
            y2={box}
            stroke="#EAE6E0"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={i * cell}
            x2={box}
            y2={i * cell}
            stroke="#EAE6E0"
            strokeWidth={1}
          />
        </React.Fragment>
      ))}
      <polygon
        points={`${cx(goal)},${cy(goal) - cell * 0.3} ${cx(goal) + cell * 0.28},${cy(goal) + cell * 0.25} ${cx(goal) - cell * 0.28},${cy(goal) + cell * 0.25}`}
        fill="#F7941D"
      />
      <circle cx={cx(start)} cy={cy(start)} r={cell * 0.26} fill="#762D90" />
    </svg>
  );
}

// ── sequence ───────────────────────────────────────────────────────────────────

function CtSequence({
  s,
  onAnswer,
}: {
  s: CtSequenceStimulus;
  onAnswer: (f: ResponseFields) => void;
}) {
  const tc = useTranslations("common");
  const [sel, setSel] = React.useState<number | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <GridBoard size={s.gridSize} start={s.start} goal={s.goal} />
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {s.options.map((prog, i) => (
          <AnswerOption
            key={i}
            selected={sel === i}
            onSelect={() => setSel(i)}
            aria-label={`Опција ${i + 1}`}
            className="min-h-14 px-3"
          >
            <ArrowRow moves={prog} size={26} />
          </AnswerOption>
        ))}
      </div>
      <Button
        onClick={() => sel != null && onAnswer(ctOptionResponse(sel))}
        disabled={sel === null}
        className="min-w-44"
      >
        {tc("confirm")}
      </Button>
    </div>
  );
}

// ── debug ────────────────────────────────────────────────────────────────────

function CtDebug({
  s,
  onAnswer,
}: {
  s: CtDebugStimulus;
  onAnswer: (f: ResponseFields) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <GridBoard size={s.gridSize} start={s.start} goal={s.goal} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {s.program.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAnswer(ctStepResponse(i))}
            aria-label={`Чекор ${i + 1}`}
            className="flex flex-col items-center gap-1 rounded-card border-2 border-border bg-surface p-1.5 outline-none hover:border-pur focus-visible:ring-[3px] focus-visible:ring-focus"
          >
            <ArrowGlyph move={m} size={30} />
            <span className="text-label font-normal text-muted">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── loop ─────────────────────────────────────────────────────────────────────

function CtLoop({
  s,
  onAnswer,
}: {
  s: CtLoopStimulus;
  onAnswer: (f: ResponseFields) => void;
}) {
  const t = useTranslations("task");
  const tc = useTranslations("common");
  const [sel, setSel] = React.useState<number | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-3">
        <ArrowRow moves={s.sequence} size={26} />
      </div>
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {s.options.map((loop, i) => (
          <AnswerOption
            key={i}
            selected={sel === i}
            onSelect={() => setSel(i)}
            aria-label={`Опција ${i + 1}`}
            className="min-h-14 gap-2 px-3"
          >
            <span className="flex items-center gap-2">
              <span className="rounded-md bg-tint-pur px-2 py-1 text-label font-semibold text-pur">
                {t("ctRepeat", { times: loop.times })}
              </span>
              <ArrowRow moves={loop.body} size={24} />
            </span>
          </AnswerOption>
        ))}
      </div>
      <Button
        onClick={() => sel != null && onAnswer(ctOptionResponse(sel))}
        disabled={sel === null}
        className="min-w-44"
      >
        {tc("confirm")}
      </Button>
    </div>
  );
}

// ── condition ─────────────────────────────────────────────────────────────────

function CtCondition({
  s,
  onAnswer,
}: {
  s: CtConditionStimulus;
  onAnswer: (f: ResponseFields) => void;
}) {
  const tc = useTranslations("common");
  const [sel, setSel] = React.useState<number | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* rule legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
        {s.rules.map((rule, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ConditionToken id={rule.when} />
            <ArrowGlyph move={rule.then} size={26} />
          </span>
        ))}
      </div>
      {/* input */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {s.input.map((c, i) => (
          <ConditionToken key={i} id={c} />
        ))}
      </div>
      {/* options */}
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {s.options.map((out, i) => (
          <AnswerOption
            key={i}
            selected={sel === i}
            onSelect={() => setSel(i)}
            aria-label={`Опција ${i + 1}`}
            className="min-h-14 px-3"
          >
            <ArrowRow moves={out} size={24} />
          </AnswerOption>
        ))}
      </div>
      <Button
        onClick={() => sel != null && onAnswer(ctOptionResponse(sel))}
        disabled={sel === null}
        className="min-w-44"
      >
        {tc("confirm")}
      </Button>
    </div>
  );
}

// ── maze ─────────────────────────────────────────────────────────────────────

function CtMaze({
  s,
  onAnswer,
}: {
  s: CtMazeStimulus;
  onAnswer: (f: ResponseFields) => void;
}) {
  const t = useTranslations("task");
  const box = 220;
  const cell = box / s.size;
  const idx = (p: Point) => p.y * s.size + p.x;

  const [path, setPath] = React.useState<Point[]>([s.start]);
  const [moves, setMoves] = React.useState<Move[]>([]);
  const doneRef = React.useRef(false);
  const current = path[path.length - 1];

  const open = (p: Point, m: Move): boolean => {
    const w = s.cells[idx(p)];
    if (m === "up") return !w.n;
    if (m === "down") return !w.s;
    if (m === "left") return !w.w;
    return !w.e;
  };

  const go = (m: Move) => {
    if (doneRef.current || !open(current, m)) return;
    const target = { x: current.x + DELTA[m].dx, y: current.y + DELTA[m].dy };
    let nextPath = path;
    let nextMoves = moves;
    if (path.length >= 2 && eq(target, path[path.length - 2])) {
      nextPath = path.slice(0, -1); // undo
      nextMoves = moves.slice(0, -1);
    } else if (!path.some((c) => eq(c, target))) {
      nextPath = [...path, target]; // advance to a fresh cell
      nextMoves = [...moves, m];
    } else {
      return; // already-visited non-parent cell — keep the walk simple
    }
    setPath(nextPath);
    setMoves(nextMoves);
    if (eq(nextPath[nextPath.length - 1], s.goal)) {
      doneRef.current = true;
      onAnswer(ctPathResponse(nextMoves));
    }
  };

  const reset = () => {
    setPath([s.start]);
    setMoves([]);
  };

  const cx = (p: Point) => p.x * cell + cell / 2;
  const cy = (p: Point) => p.y * cell + cell / 2;
  const wall = (p: Point) => s.cells[idx(p)];

  const dirs: { m: Move; label: string }[] = [
    { m: "up", label: t("ctMoveUp") },
    { m: "left", label: t("ctMoveLeft") },
    { m: "right", label: t("ctMoveRight") },
    { m: "down", label: t("ctMoveDown") },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${box} ${box}`}
        width="100%"
        className="max-w-[240px] rounded-card border-2 border-ink/15 bg-bg"
        role="img"
        aria-label="Лавиринт"
      >
        {/* breadcrumb path */}
        {path.map((p, i) =>
          i === 0 ? null : (
            <line
              key={i}
              x1={cx(path[i - 1])}
              y1={cy(path[i - 1])}
              x2={cx(p)}
              y2={cy(p)}
              stroke="#D2F3F0"
              strokeWidth={cell * 0.4}
              strokeLinecap="round"
            />
          ),
        )}
        {/* walls */}
        {s.cells.map((_, i) => {
          const p = { x: i % s.size, y: Math.floor(i / s.size) };
          const w = wall(p);
          const x0 = p.x * cell;
          const y0 = p.y * cell;
          return (
            <g key={i} stroke="#762D90" strokeWidth={2.5} strokeLinecap="round">
              {w.n && <line x1={x0} y1={y0} x2={x0 + cell} y2={y0} />}
              {w.s && (
                <line x1={x0} y1={y0 + cell} x2={x0 + cell} y2={y0 + cell} />
              )}
              {w.w && <line x1={x0} y1={y0} x2={x0} y2={y0 + cell} />}
              {w.e && (
                <line x1={x0 + cell} y1={y0} x2={x0 + cell} y2={y0 + cell} />
              )}
            </g>
          );
        })}
        <polygon
          points={`${cx(s.goal)},${cy(s.goal) - cell * 0.28} ${cx(s.goal) + cell * 0.26},${cy(s.goal) + cell * 0.24} ${cx(s.goal) - cell * 0.26},${cy(s.goal) + cell * 0.24}`}
          fill="#F7941D"
        />
        <circle
          cx={cx(current)}
          cy={cy(current)}
          r={cell * 0.24}
          fill="#762D90"
        />
      </svg>

      {/* d-pad */}
      <div className="grid grid-cols-3 gap-1.5" style={{ width: 168 }}>
        <span />
        <DpadButton dir={dirs[0]} enabled={open(current, "up")} onGo={go} />
        <span />
        <DpadButton dir={dirs[1]} enabled={open(current, "left")} onGo={go} />
        <span />
        <DpadButton dir={dirs[2]} enabled={open(current, "right")} onGo={go} />
        <span />
        <DpadButton dir={dirs[3]} enabled={open(current, "down")} onGo={go} />
        <span />
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={reset} disabled={moves.length === 0}>
          {t("efReset")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => onAnswer(ctPathResponse(moves))}
        >
          {t("efGiveUp")}
        </Button>
      </div>
    </div>
  );
}

function DpadButton({
  dir,
  enabled,
  onGo,
}: {
  dir: { m: Move; label: string };
  enabled: boolean;
  onGo: (m: Move) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onGo(dir.m)}
      disabled={!enabled}
      aria-label={dir.label}
      className={cn(
        "flex size-12 items-center justify-center rounded-card border-2 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-focus",
        enabled
          ? "border-pur bg-surface hover:bg-tint-pur"
          : "border-border bg-disabled-bg opacity-50",
      )}
    >
      <ArrowGlyph
        move={dir.m}
        size={26}
        color={enabled ? "#762D90" : "#A99CB3"}
      />
    </button>
  );
}

// ── dispatch ─────────────────────────────────────────────────────────────────

export function CtTask({
  item,
  onAnswer,
}: {
  item: CtItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
}) {
  const s = item.stimulus;
  switch (s.subtype) {
    case "sequence":
      return <CtSequence s={s} onAnswer={onAnswer} />;
    case "debug":
      return <CtDebug s={s} onAnswer={onAnswer} />;
    case "loop":
      return <CtLoop s={s} onAnswer={onAnswer} />;
    case "condition":
      return <CtCondition s={s} onAnswer={onAnswer} />;
    case "maze":
      return <CtMaze s={s} onAnswer={onAnswer} />;
  }
}
