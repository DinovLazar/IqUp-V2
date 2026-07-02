"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type {
  CtConditionStimulus,
  CtCounterStimulus,
  CtDebugStimulus,
  CtItem,
  CtLoopEventStimulus,
  CtLoopStimulus,
  CtNestedLoopStimulus,
  CtOptimizeStimulus,
  CtSequenceStimulus,
  Move,
  Point,
} from "@/features/tasks";
import { AnswerOption } from "@/components/ui/answer-option";
import { Button } from "@/components/ui/button";
import {
  ArrowGlyph,
  ConditionToken,
  EventSprite,
  RobotSprite,
  StarSprite,
} from "./glyphs";
import { uxForAge } from "@/content/tasks/levels";
import { ctOptionResponse, ctStepResponse, type ResponseFields } from "./view";

// CT — STEM (computational thinking, calibration v2). Nine symbol-only task
// families, zero text in the stimulus (instructions live in i18n chrome). The
// board is a TILE BOARD: soft-cornered tiles, a friendly geometric robot
// sprite, a star goal, obstacle tiles, and (for loopEvent) a teal event
// beacon. Programs render as a token strip: arrows, ×n repeat badges, visual
// grouping brackets for loops (double brackets for nesting) and colour+number
// if-tokens. All option families → choose an option; debug → tap the broken
// step.

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

/** The ×n repeat badge used by every loop-family token strip. */
function RepeatBadge({ times }: { times: number }) {
  const t = useTranslations("task");
  return (
    <span className="rounded-md bg-tint-pur px-2 py-1 text-label font-semibold whitespace-nowrap text-pur">
      {t("ctRepeat", { times })}
    </span>
  );
}

/** A bracketed loop group: [ ×n  body ] with a visible grouping bracket. */
function LoopGroup({
  times,
  children,
  nested,
}: {
  times: number;
  children: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <span
      className={
        "flex items-center gap-1.5 rounded-lg border-2 px-1.5 py-1 " +
        (nested ? "border-teal/60" : "border-border-pur")
      }
    >
      <RepeatBadge times={times} />
      {children}
    </span>
  );
}

/**
 * The v2 tile board: soft-cornered tiles, obstacles, the robot at start, the
 * star goal (or the teal event beacon for loopEvent).
 */
function TileBoard({
  size,
  start,
  goal,
  obstacles,
  goalKind = "star",
  box = 200,
}: {
  size: number;
  start: Point;
  goal: Point;
  obstacles: readonly Point[];
  goalKind?: "star" | "event";
  box?: number;
}) {
  const label = useTranslations("a11y")("board");
  const gap = 4;
  const cell = (box - gap * (size + 1)) / size;
  const at = (p: Point) => ({
    x: gap + p.x * (cell + gap),
    y: gap + p.y * (cell + gap),
  });
  const center = (p: Point) => ({
    x: at(p).x + cell / 2,
    y: at(p).y + cell / 2,
  });
  const spriteSize = cell * 0.82;
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      width="100%"
      className="max-w-[240px] rounded-card border border-border bg-bg"
      role="img"
      aria-label={label}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const p = { x: i % size, y: Math.floor(i / size) };
        const o = obstacles.some((ob) => eq(ob, p));
        const { x, y } = at(p);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={cell * 0.18}
              fill={o ? "#5E5862" : "#FFFFFF"}
              stroke={o ? "#231F26" : "#EAE6E0"}
              strokeWidth={1.2}
            />
            {o && (
              // obstacles are never colour-only: a cross-hatch marks them
              <path
                d={`M${x + cell * 0.3},${y + cell * 0.3} L${x + cell * 0.7},${y + cell * 0.7} M${x + cell * 0.7},${y + cell * 0.3} L${x + cell * 0.3},${y + cell * 0.7}`}
                stroke="#FAF8F4"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
      <g
        transform={`translate(${center(goal).x - spriteSize / 2} ${center(goal).y - spriteSize / 2})`}
      >
        <foreignObject width={spriteSize} height={spriteSize}>
          {goalKind === "star" ? (
            <StarSprite size={spriteSize} />
          ) : (
            <EventSprite size={spriteSize} />
          )}
        </foreignObject>
      </g>
      <g
        transform={`translate(${center(start).x - spriteSize / 2} ${center(start).y - spriteSize / 2})`}
      >
        <foreignObject width={spriteSize} height={spriteSize}>
          <RobotSprite size={spriteSize} />
        </foreignObject>
      </g>
    </svg>
  );
}

/** Shared select-an-option scaffold (board/strip stimulus + options + confirm). */
function OptionPicker({
  stimulus,
  options,
  onAnswer,
  wide,
  minTap = 44,
}: {
  stimulus: React.ReactNode;
  options: readonly React.ReactNode[];
  onAnswer: (f: ResponseFields) => void;
  /** Wide options render one per row. */
  wide?: boolean;
  /** UX_BY_AGE tap minimum for the option controls. */
  minTap?: number;
}) {
  const tc = useTranslations("common");
  const ta = useTranslations("a11y");
  const [sel, setSel] = React.useState<number | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      {stimulus}
      <div
        className={
          "grid w-full max-w-md gap-3 " +
          (wide ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")
        }
      >
        {options.map((content, i) => (
          <AnswerOption
            key={i}
            selected={sel === i}
            onSelect={() => setSel(i)}
            aria-label={ta("option", { n: i + 1 })}
            className="min-h-14 px-3"
            style={{ minHeight: minTap }}
          >
            {content}
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

// ── sequence ───────────────────────────────────────────────────────────────────

function CtSequence({
  s,
  onAnswer,
  minTap,
}: {
  s: CtSequenceStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <TileBoard
          size={s.gridSize}
          start={s.start}
          goal={s.goal}
          obstacles={s.obstacles}
        />
      }
      options={s.options.map((prog, i) => (
        <ArrowRow key={i} moves={prog} size={26} />
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── debug ────────────────────────────────────────────────────────────────────

function CtDebug({
  s,
  onAnswer,
  minTap = 44,
}: {
  s: CtDebugStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  const ta = useTranslations("a11y");
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <TileBoard
        size={s.gridSize}
        start={s.start}
        goal={s.goal}
        obstacles={s.obstacles}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {s.program.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAnswer(ctStepResponse(i))}
            aria-label={ta("step", { n: i + 1 })}
            className="flex min-h-12 min-w-12 flex-col items-center gap-1 rounded-card border-2 border-border bg-surface p-1.5 outline-none hover:border-pur focus-visible:ring-[3px] focus-visible:ring-focus"
            style={{ minWidth: minTap, minHeight: minTap }}
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
  minTap,
}: {
  s: CtLoopStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-3">
          <ArrowRow moves={s.sequence} size={26} />
        </div>
      }
      options={s.options.map((loop, i) => (
        <LoopGroup key={i} times={loop.times}>
          <ArrowRow moves={loop.body} size={24} />
        </LoopGroup>
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── loopEvent ────────────────────────────────────────────────────────────────

function CtLoopEvent({
  s,
  onAnswer,
  minTap,
}: {
  s: CtLoopEventStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <TileBoard
          size={s.gridSize}
          start={s.start}
          goal={s.eventTile}
          obstacles={s.obstacles}
          goalKind="event"
        />
      }
      options={s.options.map((body, i) => (
        // repeat-until-beacon group: the event sprite plays the ×n badge's role
        <span
          key={i}
          className="flex items-center gap-1.5 rounded-lg border-2 border-border-pur px-1.5 py-1"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-tint-pur">
            <EventSprite size={24} />
          </span>
          <ArrowRow moves={body} size={24} />
        </span>
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── condition / conditionLoop ─────────────────────────────────────────────────

function CtCondition({
  s,
  onAnswer,
  minTap,
}: {
  s: CtConditionStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  const pattern = s.patternLength ?? s.input.length;
  const groups: number[][] = [];
  for (let i = 0; i < s.input.length; i += pattern) {
    groups.push(s.input.slice(i, i + pattern));
  }
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <div className="flex flex-col items-center gap-3">
          {/* rule legend: if-token (colour+number input → arrow outcome) */}
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
            {s.rules.map((rule, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ConditionToken id={rule.when} />
                <span className="text-muted" aria-hidden>
                  →
                </span>
                <ArrowGlyph move={rule.then} size={26} />
              </span>
            ))}
          </div>
          {/* input — conditionLoop groups the repeating pattern visually */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {groups.map((group, gi) => (
              <span
                key={gi}
                className={
                  "flex items-center gap-2 " +
                  (s.subtype === "conditionLoop"
                    ? "rounded-lg border-2 border-border-pur px-1.5 py-1"
                    : "")
                }
              >
                {group.map((c, i) => (
                  <ConditionToken key={i} id={c} />
                ))}
              </span>
            ))}
          </div>
        </div>
      }
      options={s.options.map((out, i) => (
        <ArrowRow key={i} moves={out} size={24} />
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── nestedLoop ───────────────────────────────────────────────────────────────

function CtNestedLoop({
  s,
  onAnswer,
  minTap,
}: {
  s: CtNestedLoopStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  return (
    <OptionPicker
      wide
      minTap={minTap}
      stimulus={
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-3">
          <ArrowRow moves={s.sequence} size={22} />
        </div>
      }
      options={s.options.map((expr, i) => (
        <LoopGroup key={i} times={expr.outerTimes}>
          {expr.pre.length > 0 && <ArrowRow moves={expr.pre} size={22} />}
          <LoopGroup times={expr.innerTimes} nested>
            <ArrowRow moves={expr.innerBody} size={22} />
          </LoopGroup>
          {expr.post.length > 0 && <ArrowRow moves={expr.post} size={22} />}
        </LoopGroup>
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── counter ──────────────────────────────────────────────────────────────────

function CtCounter({
  s,
  onAnswer,
  minTap,
}: {
  s: CtCounterStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  const segments: Move[][] = [];
  let at = 0;
  for (const len of s.segmentLengths) {
    segments.push(s.sequence.slice(at, at + len));
    at += len;
  }
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-card border border-border bg-surface px-4 py-3">
          {segments.map((seg, i) => (
            <span
              key={i}
              className="flex items-center rounded-lg border-2 border-border px-1.5 py-1"
            >
              <ArrowRow moves={seg} size={20} />
            </span>
          ))}
          <span className="flex min-h-10 min-w-10 items-center justify-center rounded-lg border-2 border-dashed border-border-pur bg-tint-pur/40 px-2 text-xl font-bold text-pur">
            ?
          </span>
        </div>
      }
      options={s.options.map((seg, i) => (
        <ArrowRow key={i} moves={seg} size={22} />
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── optimize ─────────────────────────────────────────────────────────────────

function CtOptimize({
  s,
  onAnswer,
  minTap,
}: {
  s: CtOptimizeStimulus;
  onAnswer: (f: ResponseFields) => void;
  minTap?: number;
}) {
  return (
    <OptionPicker
      minTap={minTap}
      stimulus={
        <div className="flex flex-col items-center gap-3">
          <TileBoard
            size={s.gridSize}
            start={s.start}
            goal={s.goal}
            obstacles={s.obstacles}
          />
          {/* the working-but-wasteful program the child should better */}
          <div className="flex items-center gap-2 rounded-card border border-dashed border-border bg-surface px-3 py-2 opacity-80">
            <ArrowRow moves={s.redundantProgram} size={20} />
          </div>
        </div>
      }
      options={s.options.map((prog, i) => (
        <ArrowRow key={i} moves={prog} size={22} />
      ))}
      onAnswer={onAnswer}
    />
  );
}

// ── dispatch ─────────────────────────────────────────────────────────────────

export function CtTask({
  item,
  onAnswer,
  age,
}: {
  item: CtItem;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
  age?: number;
}) {
  const minTap = age !== undefined ? uxForAge(age).minTapPx : 44;
  const s = item.stimulus;
  switch (s.subtype) {
    case "sequence":
      return <CtSequence s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "debug":
      return <CtDebug s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "loop":
      return <CtLoop s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "loopEvent":
      return <CtLoopEvent s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "condition":
    case "conditionLoop":
      return <CtCondition s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "nestedLoop":
      return <CtNestedLoop s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "counter":
      return <CtCounter s={s} onAnswer={onAnswer} minTap={minTap} />;
    case "optimize":
      return <CtOptimize s={s} onAnswer={onAnswer} minTap={minTap} />;
  }
}
