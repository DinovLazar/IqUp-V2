# Part 1 · Phase 05 — Adaptive engine + scoring + norms · Completion Report

**Phase:** Part 1 · Phase 05 — Adaptive engine + scoring + norms
**Executing Claude:** Code
**Date completed:** 2026-06-22
**Branch:** `phase-1.05-scoring` (cut from `main` — see D-069)
**Commits:** `1413524` (phase work) + a docs commit filling these refs
**PR:** [#4](https://github.com/DinovLazar/IqUp-V2/pull/4)

## What shipped

- **Seed-norms config (`src/content/norms/`)** — one versioned tuning surface (`seed-norms.ts`) holding every tunable the engine and scorer use (start levels, expected spans, item caps, idle/validity/confidence thresholds, composite weights, raw→index formula constants). Every value is labeled a **seed** to recalibrate from pilot + anonymous data (Дел 6.6); `SCORING_VERSION`/`NORMS_VERSION` = `1.0.0`.
- **Adaptive engine (`src/features/assessment/`)** — a pure, deterministic state machine: `startSession` → `nextAction` (selector) → `applyResponse` (reducer) → `advanceDomain`, plus a `runSession` driver. Three control flows behind one interface: laddered basal/ceiling (Gf, Gv, EF, CT), span-adaptive Corsi (Gsm — +1/−1, backward only from age 8), and fixed age-sized (Gs, Glr). Per-item seeds via `deriveSeed`; each item comes from `generateItem`.
- **Scoring layer (`src/features/scoring/`)** — grading against each item's own verified key → raw scores (Дел 6.1) → derived **attention** (variability + impulsive errors; no task) → raw→0–100 indices (3 families, Прилог B.2) → five composites (Дел 6.3) → bands (Дел 6.4) → confidence (Дел 6.5) → validity flags + graduated verdict (Дел 7.1) → extremes (Дел 7.3), assembled by `finalize` into a typed `AssessmentResult`.
- **Five reusable scripted-session fixtures** (`assessment/fixtures.ts`) — logic-strong, spatial-strong, flat/typical, ceiling, strong-invalid — producing five visibly distinct index profiles (the foundation for 1.07's "5 profiles → 5 reports").
- **101-test Vitest suite** (7 new files) covering determinism, purity, the adaptive path, every formula at known points, confidence/validity/extremes, attention, slow≠wrong, and no-adapter UI-kit feeding.

## Decisions made on the fly

All logged in `Decisions.md` as **D-054 … D-069**; all numeric choices are labeled seeds to recalibrate. Highlights Chat should surface to Lazar:

1. **D-068 — result keyed to the LIVE UI kit, overriding the brief's pseudo-types.** Index keys are `logic|spatial|memory|planning|stem` (not `memoryFocus|planningSpeed|learningStem`) and the band enum is `development|solid|strong|exceptional` (not `in_development`), because the DoD requires feeding `lib/indices.ts` + the 1.03 components with **no adapter** ("live code wins").
2. **D-069 — branched from `main`, not `phase-1.04-task-bank`.** Reality diverged from the brief: `main` already has the merged PRs #1–#3 and the `phase-1.0x-*` branches are gone. (Supersedes the D-041 chain assumption.)
3. **D-060 / D-061 — EF/Glr/Attention mapped to the accuracy index family; Gs `expected` throughput seeded per-minute by age** (the spec tabulates no Gs expected rate; per-minute keeps the ×6 multiplier sane).
4. **D-064 — Gsm span fed to the index** = forward below age 8; `(forward + (backward+2))/2` from age 8 (normalises backward onto the forward scale; neutral at its own expectation).
5. **D-065 — EF ladders on goal-reached, not optimal-solve**; move-optimality feeds the raw efficiency score instead (laddering on optimality would stall the staircase).
6. **D-062 / D-063 — confidence + validity thresholds** (≥4 items high / ≤2 low; too-fast <500 ms & >30% → strong; >60% same-position, idle, mashing, random → mild). Plus D-054 (Gf start-curve as shared default), D-055 (half-step spans resolved down), D-056 (item caps), D-057 (Gs/Glr level + round by age), D-058 (domain order), D-059 (30 s idle threshold), D-066 (floor/ceiling definitions), D-067 (Gsm 6-trial backstop).

## Surprises / off-spec changes

- **The brief's branch instruction was stale.** It said `main` is at the kickoff baseline and to branch from `phase-1.04-task-bank`; in reality `main` already contains the scaffold + UI kit + task bank (PRs #1–#3 merged) and the phase branches are gone. Branched from `main` (D-069).
- **The brief's `AssessmentResult` field names didn't match the live 1.03 components.** Used the live identity (D-068) to honour the "no adapter" DoD line.
- **Gsm worst-case length.** A child sitting exactly at their span boundary oscillates pass/fail and never trips the 2-consecutive-error ceiling, so a 6-trial-per-direction backstop was added (D-067) to keep Corsi from running long (worst case 6+6 from age 8).
- **No automated AI review available** (CodeRabbit/Codex still unconnected). Substituted an internal multi-agent **adversarial review** pass over the finished code; it surfaced one genuine bug — the Gsm `floor` marker ignored the backward direction, so a fail-forward/ace-backward session could be flagged both `floor` and `ceiling`, violating their mutual-exclusivity invariant (D-066). **Fixed** (floor now requires no correct answer in *any* administered direction) and covered by two new regression tests.

## Files written / updated

**New — config:**
- `src/content/norms/seed-norms.ts` — the single seed-tuning surface
- `src/content/norms/index.ts` — barrel

**New — adaptive engine:**
- `src/features/assessment/types.ts` — engine state + response/graded shapes
- `src/features/assessment/engine.ts` — start/select/reduce/advance/run
- `src/features/assessment/fixtures.ts` — five scripted profiles + response builders + `scoreProfile`
- `src/features/assessment/index.ts` — barrel

**New — scoring:**
- `src/features/scoring/{types,grade,time,raw,indices,attention,validity,confidence,finalize,index}.ts`

**New — tests:**
- `src/features/assessment/__tests__/{engine,determinism}.test.ts`
- `src/features/scoring/__tests__/{scoring-formulas,confidence-validity-extremes,attention-time,profiles-ui,purity}.test.ts` + `helpers.ts`

**Updated — state + decisions:**
- `Decisions.md` (D-054…D-069), `src/_project-state/current-state.md`, `file-map.md`, `00_stack-and-config.md`

## Tests run + results

- `npm run build` ✓ · `npm run lint` ✓ (0 problems) · `npm run typecheck` ✓ · `npm test` ✓ (**13 files, 101 tests**) · `npm run format:check` ✓.
- **Determinism:** fixed seed + age + script → deep-equal `AssessmentResult` across runs (asserted per profile + a hand-run session).
- **Purity:** static scan finds no live clock / randomness / env / DOM / runtime React in `assessment`, `scoring`, or `norms`.
- **Adaptive path:** all-correct climbs + terminates on the cap; all-wrong floors + terminates on the 2-consecutive-error ceiling; a boundary script stabilises; start levels exact for age 5 and 13; Gsm +1/−1, consecutive-error ceiling, and backward-only-from-age-8 verified; `length`+`direction` reach the generator.
- **Formulas:** accuracy 1.0→95, span=expected→50, speed=expected→50, clamps hold at 8/99; composites exact; band boundaries (44→development … 80→exceptional).
- **Validity/confidence/extremes:** >30% too-fast→strong; >60% same-position→flag; Gs mashing→flag; idle excluded from time; few-items/random→low confidence, full→high; ceiling/floor markers set and **mutually exclusive** (regression-tested).
- **Five profiles → five distinct index vectors;** the `AssessmentResult` feeds the pentagon / band-bar / band-label / confidence-label with no adapter (typed usage test).

## Blocked / carryover

- [ ] **Connect CodeRabbit + Codex** (Cowork) — until then PRs (incl. this one) get no automated review.
- [ ] **Recalibrate every seed** in `seed-norms.ts` once pilot + anonymous data exist (especially the Gs `expected` net-per-minute table and EF/Glr/Attention family mappings) — `normsStage` flips off `"seed"` then.
- [ ] **1.06 owns the live timing behaviour** (stopwatch, idle/tab-blur detection, the gentle "all good?" nudge), practice administration, and device calibration — this phase only consumes timing as data.

## What's next

**Phase 1.06 — assessment flow / screens:** wire landing → setup → practice → the per-domain sections → completion, driving the engine (`startSession`/`nextAction`/`applyResponse`) with real responses + real timing, gating on `validity.session === "strong"` for the retry path, and rendering each `Item` (the renderer the task bank was built for). The `AssessmentResult` then flows into **1.07** (report engine), which can reuse the five fixtures here.

---
*IqUp-V2 | Part 1 · Phase 05 Completion | 2026-06-22*
