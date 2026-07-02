# Part 2 · Phase 06 — Task bank v2: research-calibrated difficulty + stimulus upgrade · Completion Report

**Phase:** Part 2 · Phase 06 — task bank v2 (calibration + stimulus rewrite)
**Executing Claude:** Code
**Date completed:** 2026-07-02
**Branch:** `phase-2.06-task-bank-v2` (cut from `main` — PR #12 was merged)
**Commits:** `6d8dbc8` + `58a6660` + the PR-ref backfill
**PR:** [#13](https://github.com/DinovLazar/IqUp-V2/pull/13) into `main` (awaiting CodeRabbit + Codex review, then Lazar's merge)

## What shipped

- **Calibration v2 everywhere.** All 7 level-1→10 ladders, per-SIGNAL start levels (the shared `START_LEVEL_BY_AGE` is deleted), item caps, expected-value norms and validity thresholds now implement the research standard from the brief (Raven's CPM/Carpenter for Gf, child rotation+chirality studies for Gv, Corsi norms for Gsm, WISC-V speeded scaling for Gs, ToL child norms for EF, KABC-II PAL for Glr, Bebras/CSTA for CT). Every interpolated value is flagged in a tested `PROVISIONAL_NORMS` register (the Phase-3 pilot worklist).
- **Engine v2.** WISC basal reverse rule (wrong first item → item-by-item demotion with the ceiling suspended; levels below the first correct credited at their level weight into the level-weighted accuracy). Gsm and Glr ladder over the v2 rows (Corsi rows carry length/direction/path with the under-8 backward→forward+crisscross substitution; Glr rows carry pairs/trials/symbol style). Gs is the speeded exception: fixed per-age parameters, 1 practice + 2 scored rounds over the same targets, no staircase/basal. Staircase + 2-consecutive-error ceiling unchanged.
- **Scoring re-anchored: 50 = typical for the exact age.** The accuracy family recentres per signal × age (`50 + (acc − expectedAcc)·75` with a closed-form typical-staircase expectation incl. basal credits); EF/Glr become level-weighted; attention normalises its CV against the age band's midpoint; validity cut-offs are age-banded (incl. a new `gs_omission` flag over a typical-miss baseline). Simulation tests pin Gf/Gv/EF/CT at exactly 50 for every age 5–13, and a typical honest run validates `ok` at every age.
- **Stimulus upgrade for all 7 families.** Composed Gf matrix cells (shape × colour × count × size × rotation on tidy fixed clusters; the 4-hue colourblind-safer rule palette) + object-notation series for pre-readers; polyomino **block figures** with true mirror foils for Gv; the canonical 9-tile Corsi board (6 tiles at 5–6) with scale+glow highlights and 700/400 ms timing; two parametric Gs symbol families whose similarity tiers are REAL (rotations/reflections/detail near-misses); a proper ToL board (visible 3/2/1 capacities, always-visible goal card, move counter, illegal-move shake that never counts as a move); pictorial + abstract Glr glyph sets with a rotation/reflection distinctiveness guard; CT tile boards with a robot sprite, star goal, obstacle tiles and bracketed loop/if token strips across **9 families** (maze retired). `UX_BY_AGE` clamps option counts in the generators and tap targets in the renderers.
- **Versions → 2.0.0** (`TASK_BANK_VERSION`, `NORMS_VERSION`, `SCORING_VERSION`); stamps flow into the score row untouched; `AssessmentResult`/`ReportModel` shapes unchanged — report engine, PDF, lead path, score write and admin panel untouched. Superseded constants deleted (no dual code paths).

## Decisions made on the fly

*All logged in `Decisions.md` (D-129 … D-140); the independent ones Chat should surface:*

1. **D-137 — EF "constrained" = every optimal path must vacate a goal peg; L9/L10 encoded `constrained: true`.** Exhaustive enumeration of the 3-ball/3-peg space shows all 6- and 7-move problems are inherently constrained (both variants exist only at 3–5 moves), and the naive "any non-goalward move" definition would mark every ≥4-move problem constrained. The ladder deviates from the brief's unmarked L9/L10 rows to keep `meta.constrained` truthful.
2. **D-138 — accuracy family recentred per signal × age + EF/Glr level-weighted (`SCORING_VERSION` 2.0.0).** The v1 `20 + acc·75` cannot put every age at 50 once start levels differ per signal; the brief's "typical ≈ 50 for every age" anchor requires per-(signal, age) expectations.
3. **D-139 — `gs_omission` fires above `0.35 + band.omission` missed targets.** The CPT-derived omission bands assume ~90% capture; symbol search is throughput-scored (~65% typical capture), so the raw cut-off would flag nearly every honest child. The commission side lands on the existing `too_fast` strong flag (band value replaces the flat 30%).
4. **D-140 — four config-encoding deviations from the brief's literal interfaces** (each because the data demanded it): `seriesNotation` lives on the series stimulus (age-driven — a promoted 6-year-old must still see objects), `GvLevel.segments`/`GsLevel.similarity` are `[min,max]` tuples (the research tables give ranges), `GlrLevel.symbolStyle` adds `"mixed"` (the ladder's L5), and the CT maze subtype is fully retired (no `path` answer kind, no d-pad renderer — no dual paths).
5. **D-134 (part) — `meta.normsStage` stays `"seed"`.** The persist schema pins the literal and the shape contract forbids widening; v2 is still pre-pilot. The file header documents the "calibration v2" reality; renaming waited for a real "calibrated" stage.

## Surprises / off-spec changes

- **EF L9/L10 constrained-by-nature** (above) — verified by exhaustively enumerating the whole 19-state space.
- **Only two trominoes exist**, so a Gv L2 "different shape" foil can be impossible at exactly 3 segments; the foil generator deterministically widens to n±1 segments when the shape pool is exhausted.
- **The fixture profiles' wrong answers had to spread across option positions** — always tapping slot 0/1 (the v1 convention) trips the `same_position` validity flag under v2's higher wrong-answer volume. The scripts now rotate off the shuffled key `(answer + 1) % optionCount`.
- **Attention's omission cut-offs don't transfer raw from CPT research to symbol search** (D-139) — applying them unadjusted flagged typical children at most ages (caught by the typical-child anchor simulation).
- **`normsStage` unchanged** (see decision 5); the brief's rename-to-"calibration-v2"-in-doc-comments is done, the filename and literal stay.
- **Cross-major local repeat-test guard → 3.01** as the brief allowed: nothing is persisted client-side yet (verified), so there is no local-progress seam to guard.

## The calibration numbers, verified

- Ladder tables and start rows are pinned by snapshot tests (`calibration-v2.test.ts`) against the brief's §1–§8 values; ladder monotonicity holds per family.
- Per-age anchors: formula anchors land at exactly 50 for all three families at every age; simulated typical children (full engine runs) land Gf/Gv/EF/CT at **exactly 50**, Glr 49–60, Gsm 42–54, Gs 43–53 (span/target granularity — documented in the anchor test), all `ok` validity, every composite in "solid" territory.
- `npm run typecheck` ✓ · `npm run lint` ✓ (0 problems) · `npm run build` ✓ · `npm test` ✓ (**59 files, 448 tests**; was 57/392) · `npm run format:check` ✓.
- Live check: `/kit` renders every v2 stimulus; a real age-6 `/procena` run starts Gf at L1 with a 3-option constancy matrix (UX clamp + basal path verified in the browser).

## Internal adversarial review

An internal multi-agent adversarial pass (6 dimensions — brief-number conformance, engine correctness, generator answer-key soundness, UX/brand/a11y, downstream contracts, test quality — every finding independently adversarially verified, several by executing the live code / mutation testing): **25 findings raised → 6 refuted, 19 confirmed** (5 must-fix). All confirmed items were fixed and regression-tested in the same PR:

- **must-fix · engine:** a single wrong answer at an L1 start level terminated the whole domain after ONE item (a mistapping 5-year-old got a permanently floored index). Fixed: a wrong L1 answer ends the basal descent with nothing credited, but the normal 2-consecutive-error ceiling decides termination (+ engine regression tests).
- **must-fix · scoring:** Gsm span scoring ignored the basal CREDIT levels (a backward-strong child who failed the forward start pinned to index 8), and a failed-only backward run averaged a zero into the span. Fixed: credited ladder rows count as passed spans in their direction (via the same `gsmLevelForAge` lookup the engine uses) and directions average only on backward EVIDENCE (+ two regression tests).
- **must-fix · generator:** Gv L1 odd-one-out with 2 options was an undecidable coin flip. Fixed: odd-one-out requires ≥3 effective options; below that the rotation family is served.
- **must-fix · a11y:** the CT if-token rendered a white numeral on the 4-hue fills (fails 4.5:1 on 3 of 4 hues → colour-only). Fixed: white disc + thick coloured ring + ink numeral. Same class of fix for the rotation pip (ink outline; it is the only rotation cue on symmetric shapes).
- **must-fix · UX (DoD):** renderers never consumed `UX_BY_AGE.minTapPx`. Fixed: `age` is threaded Assessment → TaskScreen → TaskRenderer → every task; option controls, CT debug steps and EF pegs now enforce the age minimum (≥72 px at 5–6).
- **should-fix:** the fixed-slope accuracy anchor made the top band unreachable for older ages (a perfect 13-year-old capped at ~77 while flagged `ceiling`). Fixed: piecewise-linear anchor — expected → 50, 1.0 → 95, 0 → 20 at every age. · `GLR_CONFLICT_GROUPS` missed the cue-set mirror pair [214, 215] (added; the distinctiveness test now declares the canonical pairs independently instead of importing the generator's constant). · Hardcoded Macedonian aria-labels replaced with `a11y.*` keys (board/step added). · A ~1-in-many objects-notation retry exhaustion now falls back to guaranteed-in-range minimum parameters. · Test-quality gaps closed: ALL seven ladder tables + `GS_BY_AGE` + CT family sets are now pinned by exact full-row snapshots; `itemCap`'s lone/shared mapping, the attention band's age dependence, and the Gv served-angle ∈ level-angles are asserted.
- **Confirmed but deferred (out of scope per the brief):** the report engine's `memoryForwardStronger` narrative feature is structurally unreachable under the v2 interleaved Gsm ladder (its gap threshold still assumes the deleted offset-2 world). The report engine is explicitly out of scope this phase → flagged as a carryover for the report-tuning phase.
- Refuted (examples): the gs_omission baseline (sanctioned by D-139), TileBoard's foreignObject rendering (verified pixel-identical on WebKit), EF ball colours (pass dichromat contrast + position context), the "unreachable" Gsm backstop (brief-mandated defensive constant).

## Sample dumped items (npx tsx scripts/dump-tasks.ts — ages 5/9/13 start levels)

**gf · age 5 · start level 1**
```json
{
 "signal": "gf",
 "level": 1,
 "seed": "demo-age-5",
 "practice": false,
 "difficultyWeight": 0.1,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "family": "series",
  "terms": [
   3,
   4,
   5,
   6
  ],
  "notation": "objects"
 },
 "options": [
  8,
  12,
  7
 ],
 "answer": 2,
 "meta": {
  "family": "series",
  "ruleType": "plusOneTwo"
 }
}
```

**gf · age 13 · start level 7**
```json
{
 "signal": "gf",
 "level": 7,
 "seed": "demo-age-13",
 "practice": false,
 "difficultyWeight": 0.7,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "family": "series",
  "terms": [
   1,
   12,
   3,
   15,
   5,
   18
  ],
  "notation": "digits"
 },
 "options": [
  20,
  6,
  36,
  7
 ],
 "answer": 3,
 "meta": {
  "family": "series",
  "ruleType": "interleaved"
 }
}
```

**gsm · age 13 · start level 6**
```json
{
 "signal": "gsm",
 "level": 6,
 "seed": "demo-age-13",
 "practice": false,
 "difficultyWeight": 0.6,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "tiles": [
   {
    "x": 15,
    "y": 15
   },
   {
    "x": 50,
    "y": 10
   },
   {
    "x": 85,
    "y": 20
   },
   {
    "x": 20,
    "y": 45
   },
   {
    "x": 58,
    "y": 42
   },
   {
    "x": 88,
    "y": 55
   },
   {
    "x": 12,
    "y": 78
   },
   {
    "x": 45,
    "y": 85
   },
   {
    "x": 78,
    "y": 82
   }
  ],
  "sequence": [
   1,
   2,
   5,
   2,
   7
  ],
  "direction": "forward",
  "path": "simple"
 },
 "answer": [
  1,
  2,
  5,
  2,
  7
 ],
 "meta": {
  "direction": "forward",
  "path": "simple",
  "presentationMs": 700,
  "isiMs": 400
 }
}
```

**gs · age 5 · start level 1**
```json
{
 "signal": "gs",
 "level": 1,
 "seed": "demo-age-5",
 "practice": false,
 "difficultyWeight": 0.1,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "cellCount": 12,
  "columns": 4,
  "cells": [
   24,
   24,
   30,
   30,
   6,
   12,
   0,
   12,
   30,
   30,
   0,
   0
  ],
  "targets": [
   30
  ]
 },
 "answer": [
  2,
  3,
  8,
  9
 ],
 "meta": {
  "windowSec": 40,
  "hasVisibleTimer": true,
  "similarity": [
   1,
   1
  ]
 }
}
```

**ef · age 9 · start level 4**
```json
{
 "signal": "ef",
 "level": 4,
 "seed": "demo-age-9",
 "practice": false,
 "difficultyWeight": 0.4,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "pegCapacities": [
   3,
   2,
   1
  ],
  "start": [
   [
    1
   ],
   [
    0
   ],
   [
    2
   ]
  ],
  "goal": [
   [
    2,
    1
   ],
   [
    0
   ],
   []
  ]
 },
 "answer": {
  "minMoves": 3,
  "optimalPath": [
   {
    "from": 0,
    "to": 1
   },
   {
    "from": 2,
    "to": 0
   },
   {
    "from": 1,
    "to": 0
   }
  ]
 },
 "meta": {
  "ballCount": 3,
  "constrained": true
 }
}
```

**glr · age 5 · start level 1**
```json
{
 "signal": "glr",
 "level": 1,
 "seed": "demo-age-5",
 "practice": false,
 "difficultyWeight": 0.1,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "pairs": [
   {
    "cue": 4,
    "target": 8
   },
   {
    "cue": 0,
    "target": 10
   },
   {
    "cue": 1,
    "target": 7
   },
   {
    "cue": 2,
    "target": 6
   }
  ],
  "trials": [
   {
    "cue": 2,
    "options": [
     7,
     10,
     6
    ],
    "correct": 2
   },
   {
    "cue": 0,
    "options": [
     10,
     7,
     6
    ],
    "correct": 0
   },
   {
    "cue": 1,
    "options": [
     10,
     7,
     6
    ],
    "correct": 1
   },
   {
    "cue": 4,
    "options": [
     7,
     8,
     10
    ],
    "correct": 1
   }
  ]
 },
 "answer": [
  2,
  0,
  1,
  1
 ],
 "meta": {
  "pairCount": 4,
  "trials": 3,
  "symbolStyle": "pictorial"
 }
}
```

**ct · age 13 · start level 9**
```json
{
 "signal": "ct",
 "level": 9,
 "seed": "demo-age-13",
 "practice": false,
 "difficultyWeight": 0.9,
 "taskBankVersion": "2.0.0",
 "stimulus": {
  "subtype": "counter",
  "sequence": [
   "right",
   "up",
   "right",
   "right",
   "up",
   "right",
   "right",
   "right",
   "up"
  ],
  "segmentLengths": [
   2,
   3,
   4
  ],
  "options": [
   [
    "right",
    "right",
    "right",
    "right",
    "right",
    "up"
   ],
   [
    "right",
    "right",
    "right",
    "up"
   ],
   [
    "right",
    "right",
    "right",
    "right",
    "up"
   ],
   [
    "left",
    "left",
    "left",
    "left",
    "up"
   ]
  ]
 },
 "answer": {
  "kind": "optionIndex",
  "value": 2
 },
 "meta": {
  "ctSubtype": "counter"
 }
}
```

## Files written / updated

**New:**
- `src/content/norms/__tests__/calibration-v2.test.ts` — the v2 config contract (monotonicity, start snapshots, substitution, ×-cap, provisional register, UX clamp)
- `src/features/scoring/__tests__/anchors.test.ts` — per-age "typical ≈ 50" anchors (formula + full-engine simulation)
- `.claude/launch.json` — dev-server config for the local preview tooling

**Modified (core):**
- `src/content/tasks/{levels,version}.ts` — the v2 ladders + `UX_BY_AGE` + `GS_BY_AGE` + Corsi lookups; `TASK_BANK_VERSION` 2.0.0
- `src/content/norms/seed-norms.ts` — calibration v2 (per-signal starts, caps, bands, anchors, `PROVISIONAL_NORMS`); versions 2.0.0
- `src/features/tasks/{types,gf,gv,gsm,gs,ef,glr,ct,registry}.ts` — v2 generators (age-aware, 9 CT families, block figures, tiers, constrained EF, distinctiveness guard)
- `src/features/assessment/{engine,types,flow,fixtures}.ts` — basal rule, per-signal starts, Gsm/Glr ladders, Gs rounds, start-level practice
- `src/features/scoring/{grade,raw,indices,attention,validity,finalize,types}.ts` — v2 formulas + banded validity (+`gs_omission` code)
- `src/features/assessment/tasks/{glyphs.tsx,view.ts,gf-task,gv-task,gsm-task,gs-task,ef-task,glr-task,ct-task}.tsx` — the stimulus upgrade
- `messages/mk.json` — v2 `task` strings (object series, 5 new CT families, EF moves; `ctMaze`/`ctMove*` removed)
- `src/app/kit/kit-gallery.tsx`, `src/app/globals.css`, `scripts/dump-tasks.ts` — v2 samples, shake keyframes, per-age dumps
- Test suites: `src/features/tasks/__tests__/*`, `src/features/assessment/__tests__/engine.test.ts`, `src/features/scoring/__tests__/*`, `src/features/assessment/tasks/__tests__/responses.test.ts`
- State: `Decisions.md` (D-129…D-140), `src/_project-state/{current-state,file-map,00_stack-and-config}.md`

## Tests run + results

- `npm test` — **59 files, 448 tests, all passing** (was 57/392). New coverage: ladder monotonicity (a), per-signal start snapshots (b), under-8 Gsm substitution (c), series ×-rule age cap (d), Gv mirror-foil correctness incl. true-mirror verification (e), EF constrained property via independent greedy-refutation DFS (f), Glr distinctiveness guard (g), per-age typical≈50 anchors for every index family (h), provisional-register completeness (i), UX clamp for age 6 (j), determinism with age + shared Gs target seed, Gs tier realness, byte-identical fixture re-runs.
- `npm run build` ✓ (all routes compile; PDF/report/score-row untouched), `npm run lint` ✓, `npm run typecheck` ✓, `npm run format:check` ✓.
- Browser verification (dev server): `/kit` gallery for all 7 renderers + the 9 CT families; a live age-6 `/procena` session (3-option L1 matrix, minimal clutter).

## Blocked / carryover

- [ ] **Cross-major local repeat-test guard → 3.01** (D-134): no local-progress seam exists (nothing persisted client-side); build the guard with that feature. The needed version stamps are already on every result/row.
- [ ] **Pilot recalibration worklist = `PROVISIONAL_NORMS`** (D-133): Corsi spans 8–13, backward offset, all Glr values, attention CV + omission/commission bands, Gs throughput anchors, accuracy-anchor constants.
- [ ] **Glr delayed-recall probe descoped** (D-135, brief-mandated) — revisit only if a future phase restructures session length.
- [ ] Timing/idle mechanics + the D-071 calibration-field question remain 3.01 (untouched here, per the brief).
- [ ] **Report-engine narrative seed out of date (review finding, out of scope here):** `memoryForwardStronger` in `src/features/report/features.ts` is structurally unreachable under the v2 interleaved Gsm ladder (its forward−backward gap threshold assumes the deleted offset-2 world). Retune the report-local narrative seeds (D-081) in a report phase.

## What's next

**2.05 (Vercel preview)** per the phase plan — 2.03 (Meta/GA4) stays externally blocked. Chat should tell Lazar: (1) the D-137/D-138/D-139/D-140 independent decisions, (2) that v1 anonymous rows remain analysable via their stored 1.0.0 stamps but are not comparable to v2 rows, and (3) that the pilot recalibration now has an explicit, machine-checked worklist.

---
*IqUp-V2 | Part 2 · Phase 06 Completion | 2026-07-02*
