import * as React from "react";

import { INDICES } from "@/lib/indices";
import {
  pentagonLabelPoints,
  pentagonProfilePoints,
  pentagonRings,
  pentagonSpokes,
  pointsToAttr,
  type Point,
} from "@/lib/pentagon";
import { cn } from "@/lib/utils";

// Pentagon profile (handover §3). A thin SVG view over the pure geometry module
// (src/lib/pentagon.ts) — all coordinates come from there so the future @react-pdf
// report (1.09) renders the identical shape from the same functions. Uses only
// PDF-safe primitives (polygon / polyline / line / circle / text, literal hex —
// no CSS vars, gradients, or filters).

const PUR = "#762D90";
const RING_STROKE = "#E7E0EC";
const SPOKE_STROKE = "#ECE6F0";

interface PentagonProps {
  /** Five values 0–100 in canonical index order (logic, spatial, memory, planning, stem). */
  values: number[];
  /** Rendered square size in px. */
  size?: number;
  showLabels?: boolean;
  /** Vertex label form. */
  labelVariant?: "short" | "full";
  className?: string;
  title?: string;
}

function Pentagon({
  values,
  size = 280,
  showLabels = true,
  labelVariant = "short",
  className,
  title = "Когнитивен профил",
}: PentagonProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * (showLabels ? 0.3 : 0.4);

  const rings = pentagonRings(cx, cy, r);
  const spokes = pentagonSpokes(cx, cy, r);
  const profile = pentagonProfilePoints(values, cx, cy, r);
  const labelPoints = pentagonLabelPoints(cx, cy, r);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={cn("overflow-visible", className)}
    >
      {/* grid rings */}
      {rings.map((ring, i) => (
        <polygon
          key={`ring-${i}`}
          points={pointsToAttr(ring)}
          fill="none"
          stroke={RING_STROKE}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ))}

      {/* spokes */}
      {spokes.map(([a, b], i) => (
        <line
          key={`spoke-${i}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={SPOKE_STROKE}
          strokeWidth={1}
        />
      ))}

      {/* profile polygon — violet @10% fill + 2.5px violet outline */}
      <polygon
        points={pointsToAttr(profile)}
        fill={PUR}
        fillOpacity={0.1}
        stroke={PUR}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* vertex dots — index color + 2px white ring */}
      {profile.map((p: Point, i: number) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={6}
          fill={INDICES[i].color}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      ))}

      {/* labels — small color dot above the Macedonian index name */}
      {showLabels &&
        labelPoints.map((p: Point, i: number) => {
          const meta = INDICES[i];
          return (
            <g key={`label-${i}`}>
              <circle cx={p.x} cy={p.y - 13} r={4} fill={meta.color} />
              <text
                x={p.x}
                y={p.y + 2}
                textAnchor="middle"
                fontFamily="var(--font-sans)"
                fontSize={12}
                fontWeight={600}
                fill="#231F26"
              >
                {labelVariant === "full" ? meta.label : meta.labelShort}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

export { Pentagon };
