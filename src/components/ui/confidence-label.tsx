import * as React from "react";

import { cn } from "@/lib/utils";

// Confidence chip (handover §4.2): висока / средна / ниска with a 3-bar signal
// glyph. Meaning is the word + the number of filled bars, not color alone. The
// palette has no separate green, so висока uses the brand's positive hue
// (teal-ink); средна = orange-ink; ниска = muted grey. All ≥4.5:1 as text.

export type Confidence = "high" | "medium" | "low";

// Confidence word + signal bars + ink color. The {bars,color} pair is the single
// source reused by the PDF report (1.09) via `@/features/report/pdf/theme` (a
// sync-guard test asserts the two stay equal; the PDF gets the word from i18n).
export const CONFIDENCE: Record<
  Confidence,
  { word: string; bars: number; color: string }
> = {
  high: { word: "висока", bars: 3, color: "#007D75" },
  medium: { word: "средна", bars: 2, color: "#9A6200" },
  low: { word: "ниска", bars: 1, color: "#5E5862" },
};

function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className="w-1 rounded-[1px]"
          style={{
            height: 4 + b * 3,
            backgroundColor: b <= bars ? color : "var(--color-border)",
          }}
        />
      ))}
    </span>
  );
}

interface ConfidenceLabelProps {
  level: Confidence;
  /** Prefix the chip with "Сигурност:" for standalone use. */
  showLabel?: boolean;
  className?: string;
}

function ConfidenceLabel({
  level,
  showLabel,
  className,
}: ConfidenceLabelProps) {
  const { word, bars, color } = CONFIDENCE[level];
  return (
    <span
      data-slot="confidence-label"
      className={cn("inline-flex items-center gap-1.5 text-label", className)}
      style={{ color }}
    >
      <SignalBars bars={bars} color={color} />
      {showLabel && <span className="font-normal text-muted">Сигурност:</span>}
      {word}
    </span>
  );
}

export { ConfidenceLabel };
