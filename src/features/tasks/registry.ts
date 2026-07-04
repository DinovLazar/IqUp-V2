/**
 * The signal → generator registry and the single public entry point.
 *
 * Every task in the system is produced through {@link generateItem}; the renderer
 * (1.06) and scoring engine (1.05) never call a generator module directly. A
 * per-item seed (derived from the session master seed via `deriveSeed`) makes the
 * whole battery reproducible.
 *
 * Attention (signal #5) intentionally has NO entry here — it is derived in 1.05,
 * not generated (see `types.ts` header and the completion report).
 */

import { clampLevel } from "@/content/tasks/levels";
import { generate as gf } from "./gf";
import { generate as gv } from "./gv";
import { generate as gsm } from "./gsm";
import { generate as gs } from "./gs";
import { generate as ef } from "./ef";
import { generate as glr } from "./glr";
import { generate as ct } from "./ct";
import type { GenerateOpts, Item, Signal } from "./types";

type GeneratorFn = (level: number, seed: string, opts?: GenerateOpts) => Item;

/** Maps each testable signal to its pure generator. */
export const REGISTRY: Record<Signal, GeneratorFn> = {
  gf: (l, s, o) => gf(l, s, o),
  gv: (l, s, o) => gv(l, s, o),
  gsm: (l, s, o) => gsm(l, s, o),
  gs: (l, s, o) => gs(l, s, o),
  ef: (l, s) => ef(l, s),
  glr: (l, s, o) => glr(l, s, o),
  ct: (l, s, o) => ct(l, s, o),
};

/** The signals that have a generator (Attention is derived, not generated). */
export const TESTABLE_SIGNALS = Object.keys(REGISTRY) as Signal[];

export interface GenerateItemArgs extends GenerateOpts {
  signal: Signal;
  level: number;
  seed: string | number;
  /** When true, produces an un-scored worked example (difficultyWeight 0). */
  practice?: boolean;
}

/**
 * Generate a single task item — the one entry point for the whole task bank.
 * Identical inputs always yield a deep-equal item.
 */
export function generateItem(args: GenerateItemArgs): Item {
  const { signal, level, seed, practice = false, ...opts } = args;
  const gen = REGISTRY[signal];
  const item = gen(clampLevel(level), String(seed), opts);
  if (!practice) return item;
  return { ...item, practice: true, difficultyWeight: 0 } as Item;
}

/**
 * Generate the un-scored practice example for a task type (spec Дел 7.2 — one
 * worked example precedes each new task type). v2: the caller passes the age's
 * START level via `opts.level` (the flow computes it from the per-signal start
 * tables) so the example previews what the child will actually see; defaults to
 * the easiest level for age-less dev tooling.
 */
export function generatePractice(
  signal: Signal,
  seed: string | number,
  opts?: GenerateOpts & { level?: number },
): Item {
  const { level = 1, ...rest } = opts ?? {};
  return generateItem({ signal, level, seed, practice: true, ...rest });
}
