/**
 * Admin stats — the typed shape of the `admin_score_stats` RPC output + a pure
 * normalizer (Phase 2.04). The RPC returns aggregates-only jsonb over the
 * anonymous scores store (Store A); this fills in every band with 0 so the page
 * renders a complete distribution, and coerces counts defensively.
 *
 * Bands + index order come from the SAME single sources the rest of the app uses
 * (`band-label.tsx`, `lib/indices.ts`), so the stats view can never drift from
 * the on-screen band words / index order.
 */

import { BAND_ORDER, type Band } from "@/components/ui/band-label";
import { INDEX_ORDER, type IndexKey } from "@/lib/indices";

export type Distribution = Record<string, number>;

export interface AdminStats {
  total: number;
  byAge: Distribution;
  byGender: Distribution;
  byCity: Distribution;
  byLanguage: Distribution;
  /** Per-index count of rows in each of the four bands (always all four present). */
  bands: Record<IndexKey, Record<Band, number>>;
}

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function toDistribution(value: unknown): Distribution {
  if (!value || typeof value !== "object") return {};
  const out: Distribution = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = toCount(v);
  }
  return out;
}

function emptyBands(): Record<Band, number> {
  return Object.fromEntries(BAND_ORDER.map((b) => [b, 0])) as Record<
    Band,
    number
  >;
}

/** Coerce the raw RPC jsonb into a complete, typed `AdminStats`. */
export function normalizeStats(raw: unknown): AdminStats {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const rawBands = (
    obj.bands && typeof obj.bands === "object" ? obj.bands : {}
  ) as Record<string, unknown>;

  const bands = Object.fromEntries(
    INDEX_ORDER.map((key) => {
      const counts = emptyBands();
      const perIndex = rawBands[key];
      if (perIndex && typeof perIndex === "object") {
        for (const band of BAND_ORDER) {
          counts[band] = toCount((perIndex as Record<string, unknown>)[band]);
        }
      }
      return [key, counts];
    }),
  ) as Record<IndexKey, Record<Band, number>>;

  return {
    total: toCount(obj.total),
    byAge: toDistribution(obj.byAge),
    byGender: toDistribution(obj.byGender),
    byCity: toDistribution(obj.byCity),
    byLanguage: toDistribution(obj.byLanguage),
    bands,
  };
}

/** Sort a distribution's entries by count descending, then key ascending. */
export function sortedEntries(dist: Distribution): Array<[string, number]> {
  return Object.entries(dist).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

/** Numeric-aware sort (for age buckets). */
export function sortedNumericEntries(
  dist: Distribution,
): Array<[string, number]> {
  return Object.entries(dist).sort((a, b) => Number(a[0]) - Number(b[0]));
}
