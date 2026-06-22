/**
 * Seeded pseudo-randomness — tiny, dependency-free, deterministic.
 *
 * The whole task system (Phase 1.04) and the assessment flow (1.06) draw EVERY
 * random choice through this module from an explicit seed. There is no
 * `Math.random()`, no `Date`, and no environment read anywhere downstream — so
 * the same seed always yields the same item, and 1.06 can derive a stable
 * per-item seed from a single session master seed (see {@link deriveSeed}).
 *
 * Algorithm: a 32-bit string hash (FNV-1a) feeds mulberry32. Both are well-known,
 * fast, and produce a good-enough uniform stream for procedural stimuli (this is
 * not, and need not be, cryptographic randomness).
 */

/** A deterministic random source returning a float in [0, 1). */
export type Rng = () => number;

/**
 * FNV-1a 32-bit string hash → unsigned 32-bit integer.
 * Deterministic across platforms (pure integer math on char codes).
 */
export function hashString(str: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return h >>> 0;
}

/**
 * Build a deterministic RNG from a string or number seed (mulberry32).
 * The same seed always returns a function that yields the same sequence.
 */
export function makeRng(seed: string | number): Rng {
  let a =
    (typeof seed === "number" ? seed >>> 0 : hashString(String(seed))) >>> 0;
  // Mix the seed so trivially-close seeds ("a1" vs "a2") diverge immediately.
  a = (a ^ 0x9e3779b9) >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive a child seed string from a parent seed plus labelled parts.
 * Stable and collision-resistant enough for nesting (parent → domain → item):
 *   deriveSeed("session-42", "gf", 3) === "session-42|gf|3"
 * 1.06 uses this to fan one master seed out into per-domain, per-item seeds
 * while keeping the whole tree reproducible.
 */
export function deriveSeed(
  parent: string | number,
  ...parts: (string | number)[]
): string {
  return [parent, ...parts].join("|");
}

/** Inclusive integer in [min, max]. Assumes min <= max. */
export function intInRange(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element of a non-empty array. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** True with probability `p` (default 0.5). */
export function chance(rng: Rng, p = 0.5): boolean {
  return rng() < p;
}

/** A new array, Fisher–Yates shuffled. Does not mutate the input. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * `n` distinct elements sampled without replacement (order randomized).
 * If `n >= arr.length`, returns a full shuffle.
 */
export function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(rng, arr).slice(0, Math.max(0, Math.min(n, arr.length)));
}
