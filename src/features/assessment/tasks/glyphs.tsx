/**
 * Shared, purpose-built SVG glyphs for the task renderers (brand §6: custom SVG,
 * never clip-art/emoji). Each glyph is a self-contained `<svg>` so renderers can
 * lay them out with plain fl/grid CSS; tasks that need one shared coordinate
 * space (Gv polygons, the Corsi board, the tower, the maze, CT grids) draw their
 * own SVG instead.
 *
 * Language-neutral by construction — shapes, abstract symbols and arrows carry no
 * text. Meaning is never colour-only: shapes also vary by form, an orientation
 * pip makes rotation legible on otherwise-symmetric shapes, and symbols differ in
 * outline.
 */

import * as React from "react";
import type { Move, ShapeKind } from "@/features/tasks";

/** Abstract 6-colour palette for the Gf `colorIndex` attribute (distinct hues). */
export const SHAPE_COLORS = [
  "#EC008C", // magenta
  "#00B6F1", // blue
  "#00B9AD", // teal
  "#F7941D", // orange
  "#FFC20E", // yellow
  "#762D90", // violet
] as const;

export const shapeColor = (colorIndex: number): string =>
  SHAPE_COLORS[
    ((colorIndex % SHAPE_COLORS.length) + SHAPE_COLORS.length) %
      SHAPE_COLORS.length
  ];

// ── Shape outlines on a 100×100 unit box (centred, radius ≈ 38) ────────────────

function regularPolygon(n: number, r: number, startDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (i * 360) / n) * Math.PI) / 180;
    pts.push(
      `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

function starPoints(spikes: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + (i * 180) / spikes) * Math.PI) / 180;
    pts.push(
      `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

function shapeBody(kind: ShapeKind): React.ReactNode {
  switch (kind) {
    case "circle":
      return <circle cx={50} cy={50} r={37} />;
    case "square":
      return <rect x={15} y={15} width={70} height={70} rx={7} />;
    case "triangle":
      return <polygon points="50,12 86,80 14,80" />;
    case "diamond":
      return <polygon points="50,10 88,50 50,90 12,50" />;
    case "star":
      return <polygon points={starPoints(5, 40, 17)} />;
    case "hexagon":
      return <polygon points={regularPolygon(6, 40, 0)} />;
    case "pentagon":
      return <polygon points={regularPolygon(5, 40, -90)} />;
    case "cross":
      return <path d="M38,14 H62 V38 H86 V62 H62 V86 H38 V62 H14 V38 H38 Z" />;
  }
}

interface ShapeGlyphProps {
  kind: ShapeKind;
  colorIndex?: number;
  /** Orientation in degrees (0 | 90 | 180 | 270). */
  rotation?: number;
  /** Show the white orientation pip (makes rotation legible). Default true. */
  pip?: boolean;
  size?: number;
  className?: string;
}

/** One shape, coloured, rotated, with a white orientation pip near its top. */
export function ShapeGlyph({
  kind,
  colorIndex = 5,
  rotation = 0,
  pip = true,
  size = 56,
  className,
}: ShapeGlyphProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="presentation"
      aria-hidden
    >
      <g
        transform={`rotate(${rotation} 50 50)`}
        fill={shapeColor(colorIndex)}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        {shapeBody(kind)}
        {pip && <circle cx={50} cy={22} r={6} fill="#FFFFFF" stroke="none" />}
      </g>
    </svg>
  );
}

/** Grid layout (cols per count) for the repeated shapes in a Gf matrix cell. */
function countCols(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  return 3;
}

/** A Gf matrix cell: `count` copies of one shape, coloured, rotated. */
export function CountedShape({
  kind,
  count,
  colorIndex,
  rotation,
  glyphSize = 34,
}: {
  kind: ShapeKind;
  count: number;
  colorIndex: number;
  rotation: number;
  glyphSize?: number;
}) {
  const cols = countCols(count);
  return (
    <div
      className="grid place-items-center gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: Math.max(1, count) }, (_, i) => (
        <ShapeGlyph
          key={i}
          kind={kind}
          colorIndex={colorIndex}
          rotation={rotation}
          size={glyphSize}
        />
      ))}
    </div>
  );
}

// ── Abstract symbols (Gs distractors/targets, Glr targets) ─────────────────────

const SYMBOL_COUNT = 12;

/** A distinct abstract symbol for an id (mod the symbol set). Outline-only. */
export function SymbolGlyph({
  id,
  size = 40,
  color = "#231F26",
  className,
}: {
  id: number;
  size?: number;
  color?: string;
  className?: string;
}) {
  const i = ((id % SYMBOL_COUNT) + SYMBOL_COUNT) % SYMBOL_COUNT;
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const bodies: React.ReactNode[] = [
    <circle key="c" cx={50} cy={50} r={32} {...common} />,
    <rect key="sq" x={20} y={20} width={60} height={60} rx={8} {...common} />,
    <polygon key="tri" points="50,18 82,78 18,78" {...common} />,
    <path key="plus" d="M50,18 V82 M18,50 H82" {...common} />,
    <path key="x" d="M24,24 L76,76 M76,24 L24,76" {...common} />,
    <polygon key="dia" points="50,16 84,50 50,84 16,50" {...common} />,
    <path key="chev" d="M28,26 L66,50 L28,74 M58,26 L58,74" {...common} />,
    <path key="wave" d="M16,56 Q33,30 50,56 T84,56" {...common} />,
    <polygon key="star" points={starPoints(5, 34, 15)} {...common} />,
    <polygon key="hex" points={regularPolygon(6, 34, 0)} {...common} />,
    <path key="arc" d="M22,68 A34,34 0 0 1 78,68" {...common} />,
    <path key="tee" d="M22,30 H78 M50,30 V78" {...common} />,
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      {bodies[i]}
    </svg>
  );
}

// ── Move arrows (CT) ───────────────────────────────────────────────────────────

const ARROW_ROTATION: Record<Move, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

/** A directional arrow for a CT move token. */
export function ArrowGlyph({
  move,
  size = 36,
  color = "#762D90",
  className,
}: {
  move: Move;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      <g transform={`rotate(${ARROW_ROTATION[move]} 50 50)`}>
        <path
          d="M50,18 L50,82 M50,18 L30,42 M50,18 L70,42"
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** A small colour+number token for a CT condition `when` id (paired, not colour-only). */
export function ConditionToken({
  id,
  size = 34,
}: {
  id: number;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-label font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: shapeColor(id),
      }}
    >
      {id + 1}
    </span>
  );
}
