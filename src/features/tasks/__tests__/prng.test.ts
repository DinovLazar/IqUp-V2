import { describe, expect, it } from "vitest";
import {
  chance,
  deriveSeed,
  hashString,
  intInRange,
  makeRng,
  pick,
  pickN,
  shuffle,
} from "@/lib/prng";

describe("prng", () => {
  it("makeRng is deterministic for the same seed", () => {
    const a = makeRng("seed-1");
    const b = makeRng("seed-1");
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds diverge", () => {
    const a = Array.from({ length: 20 }, makeRng("seed-1"));
    const b = Array.from({ length: 20 }, makeRng("seed-2"));
    expect(a).not.toEqual(b);
  });

  it("emits values in [0, 1)", () => {
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("hashString is stable and unsigned", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
    expect(hashString("abc")).toBeGreaterThanOrEqual(0);
  });

  it("deriveSeed is deterministic and order-sensitive", () => {
    expect(deriveSeed("p", "a", 1)).toBe(deriveSeed("p", "a", 1));
    expect(deriveSeed("p", "a", 1)).not.toBe(deriveSeed("p", 1, "a"));
    expect(deriveSeed("session-42", "gf", 3)).toBe("session-42|gf|3");
  });

  it("intInRange stays within inclusive bounds", () => {
    const rng = makeRng("range");
    for (let i = 0; i < 1000; i++) {
      const v = intInRange(rng, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("shuffle is a permutation and does not mutate input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(makeRng("s"), input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("pickN returns n distinct elements", () => {
    const out = pickN(makeRng("p"), [1, 2, 3, 4, 5, 6], 3);
    expect(out).toHaveLength(3);
    expect(new Set(out).size).toBe(3);
  });

  it("pick and chance are deterministic", () => {
    expect(pick(makeRng("x"), ["a", "b", "c"])).toBe(
      pick(makeRng("x"), ["a", "b", "c"]),
    );
    expect(chance(makeRng("x"), 0.5)).toBe(chance(makeRng("x"), 0.5));
  });
});
