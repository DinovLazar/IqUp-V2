/**
 * The five cognitive indices — the single source of truth for order, labels and
 * colors used across the app (pentagon, band bars, confidence chips,
 * puzzle-brain) and, later, the @react-pdf report (1.09).
 *
 * Order is fixed (handover §3 / spec §10.2): it is both the clockwise pentagon
 * order (vertex 0 at top) and the puzzle-brain assembly order.
 *
 * Colors are stored as literal hex (not CSS vars) so this module is safe to
 * import from @react-pdf, which cannot resolve `var(--…)`. The same hex values
 * back the Tailwind tokens in globals.css, so screen and PDF stay identical.
 */

export type IndexKey = "logic" | "spatial" | "memory" | "planning" | "stem";

export interface IndexMeta {
  key: IndexKey;
  /** 0–4: clockwise pentagon order AND puzzle-brain assembly order. */
  order: number;
  /** Full Macedonian name (parent-facing, plain language). */
  label: string;
  /** Short Macedonian name for tight layouts / pentagon vertices. */
  labelShort: string;
  /** Solid index color — vertex dots, completed brain region, bar fill. */
  color: string;
  /** Soft tint — pentagon fills, band-bar tracks, surfaces. */
  soft: string;
  /** Accessible darkened variant for COLORED TEXT only (≥4.5:1 on white). */
  ink: string;
}

export const INDICES: readonly IndexMeta[] = [
  {
    key: "logic",
    order: 0,
    label: "Логичко мислење",
    labelShort: "Логичко",
    color: "#EC008C",
    soft: "#FCE0F1",
    ink: "#B0067A",
  },
  {
    key: "spatial",
    order: 1,
    label: "Просторно мислење",
    labelShort: "Просторно",
    color: "#00B6F1",
    soft: "#D6F2FD",
    ink: "#0090C4",
  },
  {
    key: "memory",
    order: 2,
    label: "Меморија и фокус",
    labelShort: "Меморија",
    color: "#00B9AD",
    soft: "#D2F3F0",
    ink: "#007D75",
  },
  {
    key: "planning",
    order: 3,
    label: "Планирање и брзина",
    labelShort: "Планирање",
    color: "#F7941D",
    soft: "#FDEBD3",
    ink: "#9A6200",
  },
  {
    key: "stem",
    order: 4,
    label: "Учење и STEM",
    labelShort: "STEM",
    color: "#FFC20E",
    soft: "#FFF2CC",
    ink: "#9A7400",
  },
] as const;

/** Look up an index by key. */
export const INDEX_BY_KEY: Record<IndexKey, IndexMeta> = Object.fromEntries(
  INDICES.map((i) => [i.key, i]),
) as Record<IndexKey, IndexMeta>;

/** Index keys in canonical order. */
export const INDEX_ORDER: readonly IndexKey[] = INDICES.map((i) => i.key);
