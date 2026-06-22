import * as React from "react";

import { INDEX_BY_KEY, type IndexKey } from "@/lib/indices";
import { cn } from "@/lib/utils";

// Index band-label (handover §4.2). Shows the parent-facing WORD + an indicative
// range only — NEVER a numeric score (the §6.4 numeric bands stay internal to
// scoring). Meaning is carried by word + a 4-step shape glyph + the index ink
// color together, never by color alone (a11y). Colored via the index `*-ink`
// tokens (≥4.5:1).

export type Band = "development" | "solid" | "strong" | "exceptional";

/** Parent-facing word + magnitude level (1–4). Decoupled from the numeric bands. */
export const BANDS: Record<Band, { word: string; level: number }> = {
  development: { word: "Во развој", level: 1 },
  solid: { word: "Солидно", level: 2 },
  strong: { word: "Силно", level: 3 },
  exceptional: { word: "Исклучително", level: 4 },
};

export const BAND_ORDER: readonly Band[] = [
  "development",
  "solid",
  "strong",
  "exceptional",
];

function BandSteps({ level, color }: { level: number; color: string }) {
  return (
    <span className="flex items-end gap-[3px]" aria-hidden>
      {[1, 2, 3, 4].map((s) => (
        <span
          key={s}
          className="w-1 rounded-[2px]"
          style={{
            height: 5 + s * 2,
            backgroundColor: s <= level ? color : "var(--color-border)",
          }}
        />
      ))}
    </span>
  );
}

interface BandLabelProps {
  indexKey: IndexKey;
  band: Band;
  /** Indicative range caption, e.g. "горна третина за возраста". Never a number. */
  range?: string;
  className?: string;
}

function BandLabel({ indexKey, band, range, className }: BandLabelProps) {
  const meta = INDEX_BY_KEY[indexKey];
  const { word, level } = BANDS[band];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        data-slot="band-label"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label"
        style={{ backgroundColor: meta.soft, color: meta.ink }}
      >
        <BandSteps level={level} color={meta.ink} />
        {word}
      </span>
      {range && (
        <span className="text-label font-normal text-muted">{range}</span>
      )}
    </span>
  );
}

export { BandLabel };
