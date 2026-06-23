/**
 * Pentagon (radar) for the PDF (Phase 1.09) — a thin `@react-pdf` SVG view over the
 * SAME pure geometry module the web component uses (`@/lib/pentagon`), so the shape
 * is byte-for-byte the on-screen pentagon. Colors come from `@/lib/indices`.
 *
 * Pure: a function of `values` only. The 0–100 index values drive GEOMETRY ONLY
 * (the polygon shape) — no number is ever drawn as text (spec Дел 10.2). Mirrors
 * `src/components/ui/pentagon.tsx`.
 */

import * as React from "react";
import { Circle, G, Line, Polygon, Svg, Text } from "@react-pdf/renderer";

import { INDICES } from "@/lib/indices";
import {
  pentagonLabelPoints,
  pentagonProfilePoints,
  pentagonRings,
  pentagonSpokes,
  pointsToAttr,
  type Point,
} from "@/lib/pentagon";

import { PDF_COLORS, PDF_FONT_FAMILY, PDF_FONT_WEIGHT } from "./theme";

// `@react-pdf`'s SVG `<Text>` type omits the font props the renderer actually
// supports (fontSize / fontFamily / fontWeight — see `@react-pdf/types` svg.d.ts).
// A single cast restores them; the runtime accepts these props (verified).
const SvgText = Text as unknown as React.ComponentType<
  Record<string, string | number | undefined> & { children?: React.ReactNode }
>;

interface PentagonPdfProps {
  /** Five values 0–100 in canonical index order (logic, spatial, memory, planning, stem). */
  values: number[];
  size?: number;
  showLabels?: boolean;
}

export function PentagonPdf({
  values,
  size = 200,
  showLabels = true,
}: PentagonPdfProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * (showLabels ? 0.3 : 0.4);

  const rings = pentagonRings(cx, cy, r);
  const spokes = pentagonSpokes(cx, cy, r);
  const profile = pentagonProfilePoints(values, cx, cy, r);
  const labelPoints = pentagonLabelPoints(cx, cy, r);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* grid rings */}
      {rings.map((ring, i) => (
        <Polygon
          key={`ring-${i}`}
          points={pointsToAttr(ring)}
          fill="none"
          stroke={PDF_COLORS.ringStroke}
          strokeWidth={1}
        />
      ))}

      {/* spokes */}
      {spokes.map(([a, b], i) => (
        <Line
          key={`spoke-${i}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={PDF_COLORS.spokeStroke}
          strokeWidth={1}
        />
      ))}

      {/* profile polygon — violet @10% fill + violet outline */}
      <Polygon
        points={pointsToAttr(profile)}
        fill={PDF_COLORS.pur}
        fillOpacity={0.1}
        stroke={PDF_COLORS.pur}
        strokeWidth={2.5}
      />

      {/* vertex dots — index color + white ring */}
      {profile.map((p: Point, i: number) => (
        <Circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r={5}
          fill={INDICES[i].color}
          stroke={PDF_COLORS.white}
          strokeWidth={2}
        />
      ))}

      {/* labels — small color dot above the short Macedonian index name */}
      {showLabels &&
        labelPoints.map((p: Point, i: number) => {
          const meta = INDICES[i];
          return (
            <G key={`label-${i}`}>
              <Circle cx={p.x} cy={p.y - 11} r={3.2} fill={meta.color} />
              <SvgText
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fill={PDF_COLORS.ink}
                fontSize={8}
                fontFamily={PDF_FONT_FAMILY}
                fontWeight={PDF_FONT_WEIGHT.semibold}
              >
                {meta.labelShort}
              </SvgText>
            </G>
          );
        })}
    </Svg>
  );
}
