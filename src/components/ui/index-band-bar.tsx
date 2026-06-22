import * as React from "react";

import { INDEX_BY_KEY, type IndexKey } from "@/lib/indices";
import { cn } from "@/lib/utils";
import { BandLabel, type Band } from "./band-label";
import { ConfidenceLabel, type Confidence } from "./confidence-label";

// Index band bar (handover §4.2) — the per-index row used in the report: color
// dot + name, the word-label pill, a track in the index color, and an indicative
// range caption (+ optional confidence chip). The track length is an INDICATIVE
// shape mapped from the band, not a numeric value — no hard number ever appears.

const BAND_FILL: Record<Band, number> = {
  development: 0.28,
  solid: 0.52,
  strong: 0.74,
  exceptional: 0.92,
};

interface IndexBandBarProps {
  indexKey: IndexKey;
  band: Band;
  /** Indicative range caption (parent-facing, never a number). */
  range?: string;
  confidence?: Confidence;
  className?: string;
}

function IndexBandBar({
  indexKey,
  band,
  range,
  confidence,
  className,
}: IndexBandBarProps) {
  const meta = INDEX_BY_KEY[indexKey];
  const fill = BAND_FILL[band];
  return (
    <div
      data-slot="index-band-bar"
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-label text-ink">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.color }}
            aria-hidden
          />
          {meta.label}
        </span>
        <BandLabel indexKey={indexKey} band={band} />
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: meta.soft }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${fill * 100}%`, backgroundColor: meta.color }}
        />
      </div>

      {(range || confidence) && (
        <div className="flex items-center justify-between gap-3">
          {range ? (
            <span className="text-label font-normal text-muted">{range}</span>
          ) : (
            <span />
          )}
          {confidence && <ConfidenceLabel level={confidence} />}
        </div>
      )}
    </div>
  );
}

export { IndexBandBar };
