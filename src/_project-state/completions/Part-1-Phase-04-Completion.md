# Part 1 · Phase 1.04 — Task bank + procedural generators · Completion Report

**Phase:** Part 1 · Phase 1.04 — Task bank + procedural generators
**Executing Claude:** Code
**Date completed:** 2026-06-22
**Branch:** `phase-1.04-task-bank` (cut from `phase-1.03-ui-kit` — see D-041 chain)
**Commits:** _(filled at PR time)_
**PR:** _(filled at PR time)_

## What shipped

- **A seeded-randomness foundation** (`src/lib/prng.ts`): `makeRng` (mulberry32 + FNV-1a hash), `pick`/`shuffle`/`pickN`/`intInRange`/`chance`, and `deriveSeed` for stable parent→child seed derivation. It is the **only** source of randomness in the task system — no `Math.random`, `Date`, or env read appears anywhere downstream (statically enforced by a purity test).
- **Versioned task-bank config** (`src/content/tasks/`): `TASK_BANK_VERSION = "1.0.0"` (stored per anonymous record, spec Дел 19.4) and per-domain level 1→10 difficulty tables — the single place difficulty is tuned.
- **A uniform `Item` contract + 7 generators** (`src/features/tasks/`), all pure data/geometry (no React/SVG/CSS, mirroring `pentagon.ts`): **Gf** (matrix reasoning + numeric series), **Gv** (mental rotation + odd-one-out), **Gsm** (Corsi span), **Gs** (symbol search), **EF** (Tower of London, BFS-verified), **Glr** (paired-associate), **CT** (5 sub-types: sequence/debug/loop/condition/maze). One entry point `generateItem(...)`, a signal→generator `REGISTRY`, `generatePractice(...)`, and `guards.ts` type guards. **Attention has no generator** (derived signal, 1.05) — documented in code.
- **A Vitest suite** (6 files, 41 tests) proving determinism, full level/sub-type coverage, answer-key correctness (independent re-verification), distractor validity, and language-neutrality/purity. Plus an optional `scripts/dump-tasks.ts` JSON dumper.

## Decisions made on the fly

Logged in `Decisions.md` as **D-048 … D-053** (full "why" + downsides there). Summary:

1. **D-048 — Vitest, pinned exact `4.1.9`.** TS-native, near-zero config; reuses the `@/` alias. Downside: pulls Vite/esbuild into devDeps; test files are type-checked by `tsc`/`next build` (kept clean, not excluded).
2. **D-049 — CT "Debug" answer key = "first illegal (off-grid) move."** Objective and unique, vs the ambiguous "differs from the optimal path."
3. **D-050 — Gv distractors are only reflections / different shapes, never a same-shape "wrong-angle" rotation.** Guarantees a unique key (any rotation of the prompt would otherwise also be correct); base chirality is verified at generation.
4. **D-051 — `count` is the only numeric matrix attribute and is range-bounded; the rest are cyclic.** Prevents an additive count progression from being clamped mid-pattern and silently breaking the rule.
5. **D-052 — Gsm bridges the uniform `(level, seed)` registry and the spec's `(length, direction)` interface** via a level→length default table with `opts` overrides.
6. **D-053 — CT generators emit zero text (not even i18n keys).** Maximal language-neutrality; instructions are entirely the renderer's job (1.06). Any future in-data text must be an i18n key, never a literal.

## Surprises / off-spec changes

- **Spec A.8 table lists only 4 CT sub-types, but Дел 4 explicitly lists 5 (adds лавиринт/maze).** Built all 5 per the brief and Дел 4.
- **135° rotation + grid geometry.** Polyominoes can't rotate by 135° on a grid, so Gv shapes are emitted as **floating-point vertex polygons** (rounded to 3 dp); rotation/reflection are exact transforms and congruence is compared on recentred, sorted, rounded vertex sets. Chirality is verified at generation (re-seeds if a symmetric shape is produced).
- **The Gsm signature in the brief is `generate(length, direction, seed)`**, but the uniform registry is `(level, seed, opts)`; reconciled via D-052 (level→length default + `opts.length`/`opts.direction`). Identical behaviour, fits one registry.
- **No clinical content, no scoring, no timers** were added — those are 1.05/1.06. Timing values (Corsi 700 ms, Gs 20–25 s window + visible-timer flag) are recorded as **metadata only**.
- `SeriesRuleClass` (config) and `SeriesRuleType` (item meta) are duplicate string-literal unions that happen to match; left as-is (structurally compatible, keeps config/contract decoupled).

## Files written / updated

**New — code:**
- `src/lib/prng.ts` — seeded PRNG + helpers + `deriveSeed`
- `src/content/tasks/version.ts` — `TASK_BANK_VERSION`
- `src/content/tasks/levels.ts` — per-domain level 1→10 difficulty tables + accessors
- `src/content/tasks/index.ts` — config barrel
- `src/features/tasks/types.ts` — the `Item` contract (per-family stimulus/answer types, `GenerateOpts`)
- `src/features/tasks/shared.ts` — `makeBase` + coordinate geometry helpers
- `src/features/tasks/{gf,gv,gsm,gs,ef,glr,ct}.ts` — the 7 generators
- `src/features/tasks/guards.ts` — `Item` type guards
- `src/features/tasks/registry.ts` — `REGISTRY`, `generateItem`, `generatePractice`
- `src/features/tasks/index.ts` — public barrel
- `src/features/tasks/__tests__/{prng,determinism,coverage,answer-key,distractors,purity}.test.ts` — Vitest suite
- `scripts/dump-tasks.ts` — optional JSON dumper
- `vitest.config.ts` — Vitest config (node env, `@/` alias)

**Modified:**
- `package.json` — added `vitest` (devDep, exact `4.1.9`) + `test` / `test:watch` scripts
- `package-lock.json` — Vitest dependency tree
- `Decisions.md` — appended D-048 … D-053
- `src/_project-state/current-state.md` — header, branch chain, scripts, new "Task bank" section
- `src/_project-state/file-map.md` — task-bank files, `prng.ts`, `vitest.config.ts`, scripts, this report
- `src/_project-state/00_stack-and-config.md` — Phase 1.04 stack/config entry (Vitest pinned)

## Tests run + results

All commands run from a clean tree on `phase-1.04-task-bank`:

- `npm run typecheck` → **pass** (`tsc --noEmit`, no errors; includes test files)
- `npm run lint` → **pass** (ESLint, 0 problems)
- `npm test` → **pass** — `Test Files 6 passed (6) · Tests 41 passed (41)`
- `npm run build` → **pass** (`✓ Compiled successfully`, `Finished TypeScript`; routes unchanged: `/`, `/_not-found`, `/kit`)
- `npm run format:check` → **pass** ("All matched files use Prettier code style!")

Coverage of the Definition of Done, by test file:
- `prng.test.ts` — determinism, range, permutation, `deriveSeed` stability.
- `determinism.test.ts` — `generateItem`/`generatePractice` deep-equal across every signal × level 1–10 × 5 seeds, forced Gf/Gv families, all CT sub-types, Gsm length/direction; plus seed-sensitivity.
- `coverage.test.ts` — a valid item for every signal × level 1–10; CT every sub-type; both Gf/Gv families; practice per signal; **Attention absence asserted**.
- `answer-key.test.ts` — **EF `minMoves` re-verified by an independent BFS** (+ optimal path solves start→goal); Gf matrix re-derived from declared rules (and visible cells consistent); Gf series next-term inferred independently; Gsm backward = reverse(forward); Gs answer cells ⇔ target symbols; Glr trial keys ⇔ pairs; CT sequence/loop/condition each have exactly one correct option; CT debug bug = first illegal step; CT maze is a spanning tree and the stored path is the unique valid route.
- `distractors.test.ts` — unique correct among options; Gf matrix distractors differ by **exactly one attribute**; Gv exactly one pure rotation (and the odd-one-out is the only non-rotation); option polygons / CT options all distinct.
- `purity.test.ts` — static scan: no `Math.random`/`Date`/`process.env`, no React/SVG/`.tsx` in the task system; no Cyrillic outside comments; runtime scan: generators emit no Cyrillic and no whitespace (no prose) in any string.

Extra sanity (not a committed test): EF hits its **configured target `minMoves` 400/400** across levels 1–10 × 40 seeds — the BFS fallback never triggers.

## Blocked / carryover

- [ ] **Merge order (D-041):** merge `phase-1.01-scaffold` → `phase-1.03-ui-kit` → this PR onto `main`, oldest first.
- [ ] **CodeRabbit + Codex apps still not connected** (carryover from 1.03) → `docs/ai-review-setup.md`. This is an architectural PR (new engine + new dep) — a Codex review is warranted once connected.
- [ ] Commit/PR refs above to be filled when the PR is opened.

## What's next

**Phase 1.05 — Scoring & norms.** It consumes these items: raw → 0–100 indices per the seed norms (Прилог B), basal/ceiling + adaptive level selection, the derived **Attention** signal, confidence-by-domain, validity flags, time rules, and extremes. It will read `difficultyWeight`, `answer`, and the per-signal `meta` this phase emits, and should derive per-item seeds from a session master seed via `deriveSeed`. Chat should flag D-048 (new dep) and the D-049/D-050/D-053 answer-key framings to Lazar so they're ratified before scoring is built on top of them.

---
*IqUp-V2 | Part 1 · Phase 1.04 Completion | 2026-06-22*
