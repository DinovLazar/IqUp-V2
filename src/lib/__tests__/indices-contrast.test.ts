import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { INDICES, type IndexKey } from "../indices";

// The CSS token prefix per index (globals.css uses the short palette name,
// indices.ts uses the semantic IndexKey — see globals.css's own comments).
const CSS_PREFIX: Record<IndexKey, string> = {
  logic: "mag",
  spatial: "blu",
  memory: "teal",
  planning: "org",
  stem: "yel",
};

// Phase 3.02 regression guard: `indices.ts` duplicates ink/soft hex literals
// from `globals.css`'s @theme (documented at the top of indices.ts — @react-pdf
// cannot resolve CSS custom properties). An earlier miscalibration let 4 of 5
// `*-ink` colors fall below the WCAG 4.5:1 floor against their own `-soft` tint
// (axe color-contrast, fixed in this phase). This pins both invariants so a
// future edit to one file without the other regresses loudly instead of
// silently reintroducing a contrast failure.

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(hexA: string, hexB: string): number {
  const [l1, l2] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe("index ink colors — contrast + globals.css sync", () => {
  it("every ink meets 4.5:1 on its own soft tint (worst-case use: band-label pill)", () => {
    for (const idx of INDICES) {
      expect(ratio(idx.ink, idx.soft)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("every ink hex matches the same token in globals.css's @theme", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf-8",
    );
    for (const idx of INDICES) {
      const key = CSS_PREFIX[idx.key];
      const m = css.match(
        new RegExp(`--color-${key}-ink:\\s*(#[0-9a-fA-F]{6})`),
      );
      expect(m, `--color-${key}-ink not found in globals.css`).not.toBeNull();
      expect(m![1].toLowerCase()).toBe(idx.ink.toLowerCase());
    }
  });
});
