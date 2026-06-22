"use client";

import * as React from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";

import { INDEX_BY_KEY, type IndexKey } from "@/lib/indices";
import { cn } from "@/lib/utils";
import { Progress } from "./progress";

// Puzzle-brain motif (handover §2). A brain silhouette clipped into 5 regions,
// one per index, that assemble as the child clears sections: a region is dim
// (#ECE6F1 @60%) until reached, shows its soft tint + a gentle glow while filling,
// then snaps to its full index color and settles. Driven by the `completed` prop
// (0–5) via Motion — state survives re-renders. Respects prefers-reduced-motion
// (instant snap to the final frame, no movement/glow) and ships a ~40px chip
// variant. LazyMotion keeps the bundle light.

const TOTAL = 5;
const SIL =
  "M100,26 C92,16 78,14 70,22 C62,12 46,14 42,28 C30,22 18,32 22,46 " +
  "C10,50 8,66 18,74 C8,82 10,98 22,102 C16,114 24,130 40,130 " +
  "C44,144 64,150 76,140 C86,150 102,150 110,140 C122,150 142,146 146,130 " +
  "C162,132 174,118 168,104 C182,98 184,80 172,74 C184,66 180,48 166,46 " +
  "C166,30 148,22 138,30 C132,14 112,14 104,24 C103,24 101,24 100,26 Z";

// Region → index (assembly order = index.order + 1). 4 quadrant lobes + a central
// core, all clipped to the silhouette.
type RegionShape =
  | { kind: "path"; d: string }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number };

const REGIONS: { key: IndexKey; shape: RegionShape }[] = [
  { key: "logic", shape: { kind: "path", d: "M0,0 H100 V96 H0 Z" } }, // top-left
  { key: "spatial", shape: { kind: "path", d: "M100,0 H200 V96 H100 Z" } }, // top-right
  {
    key: "memory",
    shape: { kind: "ellipse", cx: 100, cy: 88, rx: 30, ry: 34 },
  }, // core
  { key: "planning", shape: { kind: "path", d: "M0,96 H100 V178 H0 Z" } }, // bottom-left
  { key: "stem", shape: { kind: "path", d: "M100,96 H200 V178 H100 Z" } }, // bottom-right
];

const DIM = "#ECE6F1";

function regionVariants(color: string, soft: string): Variants {
  return {
    idle: {
      fill: DIM,
      opacity: 0.6,
      scale: 0.94,
      filter: `drop-shadow(0 0 0px ${color}00)`,
    },
    filling: {
      fill: soft,
      opacity: 1,
      scale: 0.985,
      filter: `drop-shadow(0 0 5px ${color}88)`,
    },
    complete: {
      fill: color,
      opacity: 1,
      scale: 1,
      filter: `drop-shadow(0 0 0px ${color}00)`,
    },
  };
}

type RegionState = "idle" | "filling" | "complete";

function regionStateFor(order: number, completed: number): RegionState {
  if (completed > order) return "complete";
  if (completed === order && completed < TOTAL) return "filling";
  return "idle";
}

interface PuzzleBrainProps {
  /** Sections completed, 0–5. */
  completed?: number;
  size?: number;
  variant?: "default" | "chip";
  /** Show the word-labelled progress track under the brain (default variant). */
  showTrack?: boolean;
  className?: string;
}

function PuzzleBrain({
  completed = 0,
  size,
  variant = "default",
  showTrack,
  className,
}: PuzzleBrainProps) {
  const reduce = useReducedMotion();
  const clipId = React.useId();
  const isChip = variant === "chip";
  const px = size ?? (isChip ? 40 : 200);
  const seamW = isChip ? 5 : 3;
  const withTrack = showTrack ?? (!isChip && variant === "default");
  const value = Math.min(TOTAL, Math.max(0, completed));

  const transition: Transition = reduce
    ? { duration: 0 }
    : {
        duration: 0.42,
        ease: [0.2, 0.8, 0.2, 1],
        scale: { type: "spring", stiffness: 320, damping: 18 },
      };

  return (
    <LazyMotion features={domAnimation} strict>
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <svg
          viewBox="0 0 200 178"
          width={px}
          height={px * (178 / 200)}
          role="img"
          aria-label={`Напредок: ${value} од ${TOTAL} секции`}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={SIL} />
            </clipPath>
          </defs>

          {/* base silhouette fill */}
          <path d={SIL} fill="#F4EFF7" />

          <g clipPath={`url(#${clipId})`}>
            {/* regions */}
            {REGIONS.map(({ key, shape }) => {
              const meta = INDEX_BY_KEY[key];
              const state = regionStateFor(meta.order, value);
              const common = {
                variants: regionVariants(meta.color, meta.soft),
                initial: false as const,
                animate: state,
                transition,
                style: {
                  transformBox: "fill-box" as const,
                  transformOrigin: "center" as const,
                },
              };
              return shape.kind === "path" ? (
                <m.path key={key} d={shape.d} {...common} />
              ) : (
                <m.ellipse
                  key={key}
                  cx={shape.cx}
                  cy={shape.cy}
                  rx={shape.rx}
                  ry={shape.ry}
                  {...common}
                />
              );
            })}

            {/* puzzle seams (white) */}
            <line
              x1={100}
              y1={24}
              x2={100}
              y2={150}
              stroke="#FFFFFF"
              strokeWidth={seamW}
            />
            <line
              x1={22}
              y1={96}
              x2={178}
              y2={96}
              stroke="#FFFFFF"
              strokeWidth={seamW}
            />
            {/* core piece outline */}
            <ellipse
              cx={100}
              cy={88}
              rx={30}
              ry={34}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={seamW}
            />
            {/* interlock knobs */}
            {!isChip &&
              [
                [100, 40],
                [100, 138],
                [48, 96],
                [152, 96],
              ].map(([kx, ky]) => (
                <circle
                  key={`${kx}-${ky}`}
                  cx={kx}
                  cy={ky}
                  r={3}
                  fill="#FFFFFF"
                />
              ))}
          </g>

          {/* silhouette outline on top */}
          <path
            d={SIL}
            fill="none"
            stroke="#762D90"
            strokeOpacity={0.25}
            strokeWidth={isChip ? 3 : 2}
          />
        </svg>

        {withTrack && (
          <Progress
            value={(value / TOTAL) * 100}
            label={`${value} од ${TOTAL} секции`}
            aria-label={`${value} од ${TOTAL} секции`}
            className="max-w-[200px]"
          />
        )}
      </div>
    </LazyMotion>
  );
}

export { PuzzleBrain };
