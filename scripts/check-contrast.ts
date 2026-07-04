/**
 * Phase 3.02 contrast audit: reads the hex tokens straight out of globals.css's
 * `@theme` block and computes WCAG 2.2 relative-luminance contrast ratios for
 * every ink/soft/background pair actually used in the UI. Reproducible check —
 * not an eyeballed one. Run: `npx tsx scripts/check-contrast.ts`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token not found: ${name}`);
  return m[1];
}

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

const INDICES = ["mag", "blu", "teal", "org", "yel"] as const;
const bg = token("color-bg");
const surface = token("color-surface");
const ink = token("color-ink");
const muted = token("color-muted");

type Row = {
  pair: string;
  fg: string;
  bg: string;
  ratio: number;
  floor: number;
  exempt?: string;
};
const rows: Row[] = [];

function add(
  pair: string,
  fg: string,
  bgc: string,
  floor = 4.5,
  exempt?: string,
) {
  rows.push({
    pair,
    fg,
    bg: bgc,
    ratio: Number(ratio(fg, bgc).toFixed(2)),
    floor,
    exempt,
  });
}

// Body text on the two surfaces the app actually paints behind it.
add("ink on bg", ink, bg);
add("ink on surface", ink, surface);
add("muted on bg", muted, bg);
add("muted on surface", muted, surface);

for (const idx of INDICES) {
  const inkC = token(`color-${idx}-ink`);
  const softC = token(`color-${idx}-soft`);
  // band-label / index-band-bar pill: ink text on its own soft tint.
  add(`${idx}-ink on ${idx}-soft`, inkC, softC);
  // ink-colored text elsewhere (index-band-bar labels, glyph captions) on page bg/surface.
  add(`${idx}-ink on bg`, inkC, bg);
  add(`${idx}-ink on surface`, inkC, surface);
}

// Disabled controls are exempt from SC 1.4.3/1.4.11 (WCAG explicitly excludes
// inactive UI components) — checked and recorded, not held to the floor.
add(
  "disabled-fg on disabled-bg",
  token("color-disabled-fg"),
  token("color-disabled-bg"),
  3,
  "disabled controls are exempt from 1.4.3/1.4.11",
);

const failed = rows.filter((r) => !r.exempt && r.ratio < r.floor);

console.log(
  "pair".padEnd(28),
  "fg".padEnd(9),
  "bg".padEnd(9),
  "ratio",
  "floor",
  "status",
);
for (const r of rows) {
  const status = r.exempt ? "EXEMPT" : r.ratio >= r.floor ? "PASS" : "FAIL";
  console.log(
    r.pair.padEnd(28),
    r.fg.padEnd(9),
    r.bg.padEnd(9),
    String(r.ratio).padEnd(6),
    String(r.floor).padEnd(6),
    status,
  );
}
console.log(
  `\n${failed.length} of ${rows.length} pairs below their WCAG floor.`,
);
if (failed.length > 0) process.exitCode = 1;
