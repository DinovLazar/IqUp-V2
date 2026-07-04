/**
 * Shared, purpose-built SVG glyphs for the task renderers (brand §6: custom SVG,
 * never clip-art/emoji), calibration v2. Each glyph is a self-contained `<svg>`
 * so renderers can lay them out with plain flex/grid CSS; tasks that need one
 * shared coordinate space (Gv figures, the Corsi board, the tower, CT boards)
 * draw their own SVG instead.
 *
 * v2 additions: the 4-hue colourblind-safer rule palette (Gf attributes), a
 * size attribute on Gf cells, the PICTORIAL nameable-object set + the extended
 * ABSTRACT glyph sets for Glr (ids mirror the generator's pools + conflict
 * groups), the two parametric Gs symbol families with REAL similarity-tier
 * variants (rotations/reflections/detail near-misses), and the CT robot / star
 * / obstacle / token sprites.
 *
 * Language-neutral by construction — shapes, abstract symbols and arrows carry
 * no text. Meaning is never colour-only: shapes also vary by form, an
 * orientation pip makes rotation legible, and symbols differ in outline.
 */

import * as React from "react";
import type { Move, ShapeKind } from "@/features/tasks";

/**
 * The 4-hue colourblind-safer subset for RULE-attribute colours (v2 §Stimulus):
 * magenta / blue / yellow / teal — never magenta+violet or yellow+orange as a
 * discriminating pair. Gf `colorIndex` (0–3) and CT condition tokens map here.
 */
export const SHAPE_COLORS = [
  "#EC008C", // magenta
  "#00B6F1", // blue
  "#FFC20E", // yellow
  "#00B9AD", // teal
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

/** Gf size attribute (0/1/2) → glyph scale factor. */
export const SIZE_SCALE = [0.68, 0.88, 1.08] as const;
export const sizeScale = (size: number): number =>
  SIZE_SCALE[
    ((size % SIZE_SCALE.length) + SIZE_SCALE.length) % SIZE_SCALE.length
  ];

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
  colorIndex = 0,
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
        {pip && (
          // Ink outline keeps the pip ≥3:1 against every rule hue (a11y —
          // on symmetric shapes the pip is the only rotation cue).
          <circle
            cx={50}
            cy={22}
            r={6}
            fill="#FFFFFF"
            stroke="#231F26"
            strokeWidth={2.5}
          />
        )}
      </g>
    </svg>
  );
}

/** Tidy fixed cluster positions for 1–5 repeated shapes (never scatter). */
const COUNT_LAYOUT: readonly (readonly { x: number; y: number }[])[] = [
  [{ x: 50, y: 50 }],
  [
    { x: 32, y: 50 },
    { x: 68, y: 50 },
  ],
  [
    { x: 50, y: 30 },
    { x: 30, y: 68 },
    { x: 70, y: 68 },
  ],
  [
    { x: 31, y: 31 },
    { x: 69, y: 31 },
    { x: 31, y: 69 },
    { x: 69, y: 69 },
  ],
  [
    { x: 29, y: 29 },
    { x: 71, y: 29 },
    { x: 50, y: 50 },
    { x: 29, y: 71 },
    { x: 71, y: 71 },
  ],
];

/**
 * A Gf matrix cell: `count` copies of one shape on a FIXED internal grid (tidy
 * clusters, v2), coloured, rotated, scaled by the size attribute.
 */
export function CountedShape({
  kind,
  count,
  colorIndex,
  rotation,
  sizeStep = 1,
  glyphSize = 72,
}: {
  kind: ShapeKind;
  count: number;
  colorIndex: number;
  rotation: number;
  /** The v2 size attribute (0 small / 1 medium / 2 large). */
  sizeStep?: number;
  glyphSize?: number;
}) {
  const n = Math.max(1, Math.min(5, count));
  const layout = COUNT_LAYOUT[n - 1];
  const scale = sizeScale(sizeStep);
  // Per-glyph radius shrinks with the cluster size so groups stay tidy.
  const unit = (n === 1 ? 0.86 : n === 2 ? 0.52 : 0.42) * scale;
  return (
    <svg
      viewBox="0 0 100 100"
      width={glyphSize}
      height={glyphSize}
      role="presentation"
      aria-hidden
    >
      {layout.map((pos, i) => (
        <g
          key={i}
          transform={`translate(${pos.x} ${pos.y}) scale(${unit}) translate(-50 -50) rotate(${rotation} 50 50)`}
          fill={shapeColor(colorIndex)}
          stroke="rgba(0,0,0,0.16)"
          strokeWidth={2 / unit}
          strokeLinejoin="round"
        >
          {shapeBody(kind)}
          <circle
            cx={50}
            cy={22}
            r={6}
            fill="#FFFFFF"
            stroke="#231F26"
            strokeWidth={2.5 / unit}
          />
        </g>
      ))}
    </svg>
  );
}

/** An object-notation series term: `count` teal dots in a tidy cluster (v2 —
 * pre-readers never see numerals). Rows of up to 4 keep 1–12 countable. */
export function ObjectCount({
  count,
  size = 64,
  color = "#00B9AD",
}: {
  count: number;
  size?: number;
  color?: string;
}) {
  const n = Math.max(0, Math.min(12, count));
  const cols = n <= 4 ? n || 1 : 4;
  const rows = Math.max(1, Math.ceil(n / 4));
  const r = 9;
  const gapX = 100 / (cols + 1);
  const gapY = 100 / (rows + 1);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
    >
      {Array.from({ length: n }, (_, i) => {
        const cx = gapX * ((i % cols) + 1);
        const cy = gapY * (Math.floor(i / cols) + 1);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={color}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

// ── Pictorial nameable objects (Glr, ids 0–11) ────────────────────────────────

const stroke = {
  fill: "none",
  stroke: "#231F26",
  strokeWidth: 6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PICTORIAL_BODIES: readonly React.ReactNode[] = [
  // 0 sun
  <g key="sun">
    <circle
      cx={50}
      cy={50}
      r={20}
      fill="#FFC20E"
      stroke="#231F26"
      strokeWidth={5}
    />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line
          key={i}
          x1={50 + Math.cos(a) * 30}
          y1={50 + Math.sin(a) * 30}
          x2={50 + Math.cos(a) * 42}
          y2={50 + Math.sin(a) * 42}
          stroke="#231F26"
          strokeWidth={6}
          strokeLinecap="round"
        />
      );
    })}
  </g>,
  // 1 house
  <g key="house">
    <rect
      x={26}
      y={46}
      width={48}
      height={36}
      rx={3}
      fill="#00B6F1"
      stroke="#231F26"
      strokeWidth={5}
    />
    <polygon
      points="20,48 50,20 80,48"
      fill="#EC008C"
      stroke="#231F26"
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <rect
      x={43}
      y={60}
      width={14}
      height={22}
      rx={2}
      fill="#FFFFFF"
      stroke="#231F26"
      strokeWidth={4}
    />
  </g>,
  // 2 fish
  <g key="fish">
    <path
      d="M20,50 Q42,26 64,42 Q74,50 64,58 Q42,74 20,50 Z"
      fill="#00B9AD"
      stroke="#231F26"
      strokeWidth={5}
    />
    <polygon
      points="64,50 84,34 84,66"
      fill="#00B9AD"
      stroke="#231F26"
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <circle cx={34} cy={46} r={4} fill="#231F26" />
  </g>,
  // 3 star
  <polygon
    key="star"
    points={starPoints(5, 38, 16)}
    fill="#FFC20E"
    stroke="#231F26"
    strokeWidth={5}
    strokeLinejoin="round"
  />,
  // 4 leaf
  <g key="leaf">
    <path
      d="M50,16 Q82,38 50,84 Q18,38 50,16 Z"
      fill="#00B9AD"
      stroke="#231F26"
      strokeWidth={5}
    />
    <line
      x1={50}
      y1={26}
      x2={50}
      y2={76}
      stroke="#231F26"
      strokeWidth={4}
      strokeLinecap="round"
    />
  </g>,
  // 5 key
  <g key="key">
    <circle
      cx={34}
      cy={36}
      r={14}
      fill="#FFC20E"
      stroke="#231F26"
      strokeWidth={5}
    />
    <path d="M44,46 L72,74 M72,74 L80,66 M62,64 L70,56" {...stroke} />
  </g>,
  // 6 boat
  <g key="boat">
    <polygon
      points="22,62 78,62 66,80 34,80"
      fill="#EC008C"
      stroke="#231F26"
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <line
      x1={50}
      y1={22}
      x2={50}
      y2={62}
      stroke="#231F26"
      strokeWidth={5}
      strokeLinecap="round"
    />
    <polygon
      points="54,26 76,54 54,54"
      fill="#00B6F1"
      stroke="#231F26"
      strokeWidth={5}
      strokeLinejoin="round"
    />
  </g>,
  // 7 bell
  <g key="bell">
    <path
      d="M50,20 Q68,20 68,46 L70,62 L30,62 L32,46 Q32,20 50,20 Z"
      fill="#FFC20E"
      stroke="#231F26"
      strokeWidth={5}
    />
    <circle cx={50} cy={72} r={7} fill="#231F26" />
  </g>,
  // 8 flower
  <g key="flower">
    {Array.from({ length: 5 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      return (
        <circle
          key={i}
          cx={50 + Math.cos(a) * 20}
          cy={50 + Math.sin(a) * 20}
          r={13}
          fill="#EC008C"
          stroke="#231F26"
          strokeWidth={4}
        />
      );
    })}
    <circle
      cx={50}
      cy={50}
      r={11}
      fill="#FFC20E"
      stroke="#231F26"
      strokeWidth={4}
    />
  </g>,
  // 9 moon
  <path
    key="moon"
    d="M62,16 A38,38 0 1 0 62,84 A30,30 0 1 1 62,16 Z"
    fill="#FFC20E"
    stroke="#231F26"
    strokeWidth={5}
  />,
  // 10 cloud
  <path
    key="cloud"
    d="M30,66 Q16,66 16,54 Q16,44 28,44 Q30,28 46,28 Q60,28 62,40 Q84,38 84,54 Q84,66 70,66 Z"
    fill="#6FD0F6"
    stroke="#231F26"
    strokeWidth={5}
  />,
  // 11 cup
  <g key="cup">
    <path
      d="M28,30 L34,80 L66,80 L72,30 Z"
      fill="#00B6F1"
      stroke="#231F26"
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <path d="M72,40 Q88,42 82,56 Q78,64 68,62" {...stroke} strokeWidth={5} />
  </g>,
];

/** A pictorial nameable-object glyph (Glr cues/targets, ids 0–11). */
export function PictorialGlyph({
  id,
  size = 44,
  className,
}: {
  id: number;
  size?: number;
  className?: string;
}) {
  const i =
    ((id % PICTORIAL_BODIES.length) + PICTORIAL_BODIES.length) %
    PICTORIAL_BODIES.length;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      {PICTORIAL_BODIES[i]}
    </svg>
  );
}

// ── Abstract glyph sets (Glr, ids 100–119 targets / 200–219 cues) ─────────────

/** 20 abstract bodies. Indices 3↔4, 10↔11 and 14↔15 are rotation/reflection
 * pairs ON PURPOSE — they back the generator's GLR_CONFLICT_GROUPS guard. */
function abstractBody(i: number, color: string): React.ReactNode {
  const c = {
    fill: "none",
    stroke: color,
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const bodies: React.ReactNode[] = [
    <circle key="0" cx={50} cy={50} r={30} {...c} />,
    <rect key="1" x={22} y={22} width={56} height={56} rx={8} {...c} />,
    <polygon key="2" points="50,18 82,78 18,78" {...c} />,
    <path key="3" d="M50,20 V80 M20,50 H80" {...c} />, // plus (pairs with 4)
    <path key="4" d="M26,26 L74,74 M74,26 L26,74" {...c} />, // × (rot of 3)
    <polygon key="5" points="50,16 84,50 50,84 16,50" {...c} />,
    <path key="6" d="M16,56 Q33,30 50,56 T84,56" {...c} />,
    <polygon key="7" points={starPoints(5, 32, 14)} {...c} />,
    <polygon key="8" points={regularPolygon(6, 32, 0)} {...c} />,
    <path key="9" d="M22,66 A32,32 0 0 1 78,66" {...c} />,
    <path key="10" d="M34,24 L66,50 L34,76" {...c} />, // chevron-right (pairs 11)
    <path key="11" d="M66,24 L34,50 L66,76" {...c} />, // chevron-left
    <path key="12" d="M22,28 H78 M50,28 V78" {...c} />,
    <g key="13">
      <circle cx={50} cy={50} r={28} {...c} />
      <circle cx={50} cy={50} r={6} fill={color} stroke="none" />
    </g>,
    <path key="14" d="M70,24 Q30,30 50,50 Q70,70 30,76" {...c} />, // S (pairs 15)
    <path key="15" d="M30,24 Q70,30 50,50 Q30,70 70,76" {...c} />, // Z (mirror)
    <path key="16" d="M30,70 Q30,30 60,30 Q80,30 80,50" {...c} />,
    <path key="17" d="M20,64 L38,40 L54,64 L72,40" {...c} />,
    <g key="18">
      <rect x={26} y={26} width={48} height={48} rx={6} {...c} />
      <line x1={26} y1={50} x2={74} y2={50} {...c} />
    </g>,
    <path key="19" d="M32,22 V78 M58,22 V78 M58,50 H80" {...c} />,
  ];
  return bodies[((i % bodies.length) + bodies.length) % bodies.length];
}

/**
 * An abstract glyph for a Glr id: 100–119 = target set (ink outline), 200–219 =
 * cue set (violet, on the emphasis tint in the renderer). Legacy small ids map
 * into the target range.
 */
export function AbstractGlyph({
  id,
  size = 40,
  className,
}: {
  id: number;
  size?: number;
  className?: string;
}) {
  const isCue = id >= 200;
  const idx = id % 100;
  const color = isCue ? "#762D90" : "#231F26";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      {abstractBody(idx, color)}
    </svg>
  );
}

/** Glr glyph dispatch: pictorial ids < 100, abstract sets 100+/200+. */
export function GlrGlyph({
  id,
  size = 40,
  className,
}: {
  id: number;
  size?: number;
  className?: string;
}) {
  if (id < 100)
    return <PictorialGlyph id={id} size={size} className={className} />;
  return <AbstractGlyph id={id} size={size} className={className} />;
}

/** Legacy alias (Gs cells now use GsSymbolGlyph; Glr uses GlrGlyph). */
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
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      {abstractBody(id, color)}
    </svg>
  );
}

// ── Gs parametric symbol families (family × variant ids) ──────────────────────

/**
 * Six asymmetric base glyphs. Similarity tiers are REAL transformations:
 * rot90 / rot180 / reflect are exact transforms of the base; detailA/detailB
 * are one-detail near-miss variants (an added tick / a shortened stroke).
 */
function gsBase(
  family: number,
  color: string,
  detail: 0 | 1 | 2,
): React.ReactNode {
  const c = {
    fill: "none",
    stroke: color,
    strokeWidth: 8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (((family % 6) + 6) % 6) {
    case 0: // flag: pole + right-facing pennant
      return (
        <g>
          <path d="M34,20 V80" {...c} />
          {detail !== 2 && <path d="M34,22 L72,34 L34,48" {...c} />}
          {detail === 2 && (
            <path d="M34,22 L72,34 L34,48 M34,58 L60,66" {...c} />
          )}
          {detail === 1 && (
            <circle cx={34} cy={84} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
    case 1: // hook (J)
      return (
        <g>
          <path d="M60,18 V60 Q60,80 42,80 Q28,80 28,66" {...c} />
          {detail === 1 && <path d="M50,18 H70" {...c} />}
          {detail === 2 && (
            <circle cx={28} cy={58} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
    case 2: // corner stroke (7-like abstract angle)
      return (
        <g>
          <path d="M24,26 H74 L40,80" {...c} />
          {detail === 1 && <path d="M34,52 H58" {...c} />}
          {detail === 2 && (
            <circle cx={74} cy={26} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
    case 3: // loop on a pole (P-like abstract)
      return (
        <g>
          <path d="M34,80 V22 Q66,22 66,42 Q66,58 34,56" {...c} />
          {detail === 1 && <path d="M34,68 H54" {...c} />}
          {detail === 2 && (
            <circle cx={66} cy={42} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
    case 4: // step / staircase corner
      return (
        <g>
          <path d="M24,72 H46 V48 H68 V26" {...c} />
          {detail === 1 && <path d="M24,84 H40" {...c} />}
          {detail === 2 && (
            <circle cx={68} cy={20} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
    default: // dot with a tail
      return (
        <g>
          <circle cx={42} cy={40} r={18} {...c} />
          <path d="M54,54 L76,78" {...c} />
          {detail === 1 && <path d="M64,78 H80" {...c} />}
          {detail === 2 && (
            <circle cx={42} cy={40} r={5} fill={color} stroke="none" />
          )}
        </g>
      );
  }
}

/**
 * A Gs symbol for an encoded id (family · 6 + variant): base / rot90 / rot180 /
 * reflect are exact transforms; detailA / detailB are near-miss variants.
 */
export function GsSymbolGlyph({
  id,
  size = 30,
  color = "#231F26",
  className,
}: {
  id: number;
  size?: number;
  color?: string;
  className?: string;
}) {
  const family = Math.floor(id / 6) % 6;
  const variant = id % 6;
  const transform =
    variant === 1
      ? "rotate(90 50 50)"
      : variant === 2
        ? "rotate(180 50 50)"
        : variant === 3
          ? "translate(100 0) scale(-1 1)"
          : undefined;
  const detail = variant === 4 ? 1 : variant === 5 ? 2 : 0;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
      className={className}
    >
      <g transform={transform}>{gsBase(family, color, detail)}</g>
    </svg>
  );
}

// ── Move arrows + CT sprites ──────────────────────────────────────────────────

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

/**
 * A colour+number token for a CT condition `when` id: a thick coloured ring
 * around an INK numeral on white, so the number stays ≥4.5:1 on every hue and
 * meaning is never colour-only (a11y).
 */
export function ConditionToken({
  id,
  size = 34,
}: {
  id: number;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-white text-label font-semibold text-ink"
      style={{
        width: size,
        height: size,
        border: `${Math.max(4, Math.round(size * 0.16))}px solid ${shapeColor(id)}`,
      }}
    >
      {id + 1}
    </span>
  );
}

/** The friendly geometric CT robot sprite (custom SVG, no character IP). */
export function RobotSprite({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
    >
      <line
        x1={50}
        y1={10}
        x2={50}
        y2={22}
        stroke="#762D90"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle
        cx={50}
        cy={10}
        r={6}
        fill="#FFC20E"
        stroke="#762D90"
        strokeWidth={3}
      />
      <rect x={22} y={22} width={56} height={50} rx={14} fill="#762D90" />
      <circle cx={39} cy={44} r={7} fill="#FFFFFF" />
      <circle cx={61} cy={44} r={7} fill="#FFFFFF" />
      <circle cx={39} cy={44} r={3} fill="#231F26" />
      <circle cx={61} cy={44} r={3} fill="#231F26" />
      <path
        d="M38,60 Q50,68 62,60"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <rect x={30} y={74} width={12} height={12} rx={4} fill="#762D90" />
      <rect x={58} y={74} width={12} height={12} rx={4} fill="#762D90" />
    </svg>
  );
}

/** The CT goal star. */
export function StarSprite({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
    >
      <polygon
        points={starPoints(5, 42, 18)}
        fill="#FFC20E"
        stroke="#9A7400"
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The loopEvent target tile marker (teal ring — an "event" beacon). */
export function EventSprite({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="presentation"
      aria-hidden
    >
      <circle
        cx={50}
        cy={50}
        r={30}
        fill="none"
        stroke="#00B9AD"
        strokeWidth={10}
      />
      <circle cx={50} cy={50} r={9} fill="#00B9AD" />
    </svg>
  );
}
