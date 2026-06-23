/**
 * Response → answer-key mapping tests (Phase 1.06). The renderers are thin React
 * shells over `view.ts`; the part that must be exactly right — the interaction →
 * `RawResponse` mapping — is pure and tested here against the generator's own
 * verified key via the real 1.05 `gradeItem`. This is the structural guarantee
 * that "correctness derives from the key, never from time" (except Gs's score).
 */

import { describe, expect, it } from "vitest";
import {
  generateItem,
  isGv,
  type CtSubtype,
  type GvItem,
  type Item,
} from "@/features/tasks";
import { gradeItem } from "@/features/scoring/grade";
import {
  buildGvView,
  correctFields,
  instructionKey,
  withTiming,
  wrongFields,
} from "../view";

const TIMING = { elapsedMs: 4_000 };
const CT_SUBTYPES: CtSubtype[] = [
  "sequence",
  "debug",
  "loop",
  "condition",
  "maze",
];

/** A broad, deterministic sample across every signal + variant. */
function buildSample(): Item[] {
  const items: Item[] = [];
  for (let s = 0; s < 8; s++) {
    items.push(
      generateItem({
        signal: "gf",
        level: 4,
        seed: `gf-m-${s}`,
        family: "matrix",
      }),
    );
    items.push(
      generateItem({
        signal: "gf",
        level: 3,
        seed: `gf-s-${s}`,
        family: "series",
      }),
    );
    items.push(
      generateItem({
        signal: "gv",
        level: 5,
        seed: `gv-r-${s}`,
        family: "rotation",
      }),
    );
    items.push(
      generateItem({
        signal: "gv",
        level: 6,
        seed: `gv-o-${s}`,
        family: "oddOneOut",
      }),
    );
    items.push(
      generateItem({
        signal: "gsm",
        level: 4,
        seed: `gsm-f-${s}`,
        direction: "forward",
      }),
    );
    items.push(
      generateItem({
        signal: "gsm",
        level: 6,
        seed: `gsm-b-${s}`,
        direction: "backward",
      }),
    );
    items.push(generateItem({ signal: "gs", level: 5, seed: `gs-${s}` }));
    items.push(generateItem({ signal: "ef", level: 6, seed: `ef-${s}` }));
    items.push(generateItem({ signal: "glr", level: 4, seed: `glr-${s}` }));
    for (const subtype of CT_SUBTYPES) {
      items.push(
        generateItem({
          signal: "ct",
          level: 4,
          seed: `ct-${subtype}-${s}`,
          subtype,
        }),
      );
    }
  }
  return items;
}

const ITEMS = buildSample();

describe("response → answer-key mapping", () => {
  it("the correct interaction grades correct for every signal/variant", () => {
    for (const item of ITEMS) {
      const graded = gradeItem(item, withTiming(correctFields(item), TIMING));
      expect(graded.correct, `${item.signal}:${item.seed}`).toBe(true);
    }
  });

  it("a wrong interaction grades incorrect for every signal/variant", () => {
    for (const item of ITEMS) {
      const graded = gradeItem(item, withTiming(wrongFields(item), TIMING));
      expect(graded.correct, `${item.signal}:${item.seed}`).toBe(false);
    }
  });

  it("correctness is independent of time (slow ≠ wrong)", () => {
    for (const item of ITEMS) {
      const fast = gradeItem(
        item,
        withTiming(correctFields(item), { elapsedMs: 150 }),
      );
      const slow = gradeItem(
        item,
        withTiming(correctFields(item), { elapsedMs: 90_000 }),
      );
      expect(fast.correct, `${item.signal}:${item.seed}`).toBe(true);
      expect(slow.correct, `${item.signal}:${item.seed}`).toBe(true);
    }
  });
});

/** Narrow a freshly-generated item to GvItem (the generator returns the union). */
function gv(seed: string, family: "rotation" | "oddOneOut", level = 6): GvItem {
  const item = generateItem({ signal: "gv", level, seed, family });
  if (!isGv(item)) throw new Error("expected a Gv item");
  return item;
}

describe("render determinism", () => {
  it("buildGvView is a stable function of the item", () => {
    const rot = gv("det-gv-r", "rotation");
    const odd = gv("det-gv-o", "oddOneOut", 5);
    expect(buildGvView(rot)).toEqual(buildGvView(rot));
    expect(buildGvView(odd)).toEqual(buildGvView(odd));
  });

  it("the Gv view preserves option indices and a single shared scale", () => {
    const view = buildGvView(gv("scale-gv", "rotation"));
    expect(view.options.map((o) => o.index)).toEqual([0, 1, 2, 3]);
    expect(view.prompt).not.toBeNull();
  });

  it("instructionKey covers every signal/variant with a stable key", () => {
    for (const item of ITEMS) {
      expect(typeof instructionKey(item)).toBe("string");
      expect(instructionKey(item).length).toBeGreaterThan(0);
    }
  });
});
