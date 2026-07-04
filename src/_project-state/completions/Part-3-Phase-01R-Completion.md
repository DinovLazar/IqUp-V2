# Part 3 · Phase 01R — Reconcile the 3.01 branch with the merged 2.06 `main` · Completion Report

**Phase:** Part 3 · Phase 01R — 3.01 ↔ 2.06 validity-threshold reconciliation
**Executing Claude:** Code
**Date completed:** 2026-07-04
**Branch:** `phase-3.01R-threshold-reconcile` (off the current `main` tip `fb54d1d`)
**Commits:** _see PR_
**PR:** _opened after push — backfilled below_

## TL;DR — the premise had already changed

The brief assumes `phase-3.01-validity-hardening` is **unmerged** with an open PR to reconcile in place. **It is not.** Verified against live git:

- `main` tip `fb54d1d` = **"Merge pull request #14 from …phase-3.01-validity-hardening"** — PR #14 is **already merged** by the owner.
- The 3.01 branch tip `2a9bb67` ("Merge main (2.06 task-bank-v2) into phase-3.01 — resolve conflicts") is an **ancestor of `main`**.

So Tasks 1 (the git merge), 2 (the D-129→D-133 → **D-141→D-145** renumber + the reconciliation note), and most of 5 (the union state files) were done in a **prior session** and shipped in PR #14. **But that merge was mechanical** — it did **not** do the phase's one semantic task (Task 3), and it left the D-146 decision and the 01R report unwritten. Surfaced to the owner, who chose **"fix it properly + paperwork."** This report covers that remaining, real work, delivered on a **new branch** off the merged tip (the 3.01 PR is closed and cannot be reopened — D-147).

## What shipped

- **The real reconciliation (Task 3):** 2.06's age-banded too-fast `commission` cut-off is restored as the **single source of the age axis** for the `too_fast` STRONG flag; 3.01's parent-assist + device-relative-ms modifiers now layer **on top**; the duplicate young-band relaxation of the *fraction* is dropped (kept for the idle count, which 2.06 does not age-band). **No norm VALUE re-tuned** (D-146).
- **`band.commission` un-orphaned.** The mechanical merge had left `ATTENTION_BANDS[].commission` as **dead code** while it was still registered in `PROVISIONAL_NORMS`; it now drives the flag again, so the register points at a live value.
- **Tests strengthened to actually separate the two systems** (the merged suite passed only *coincidentally* on the too-fast checks). New: an older-age discriminator, per-band resolver assertions, a no-young-double-count assertion, and a finalize-level "no context ⇒ pure post-2.06 verdict" proof. **68 files, 500 tests** green; `npm run build` green.
- **Decisions + state files finished as the union:** D-146 (composition) + D-147 (branch), the last stale `D-129` (3.01-meaning) references tidied, and `current-state.md` / `file-map.md` / `00_stack-and-config.md` corrected (incl. removing the self-contradictory "2.06 not yet run" carryover and adding the missing 3.01 stack-config entry).

## The conflict list and how each was resolved

| # | Conflict (per the brief) | State on arrival | Resolution this phase |
|---|---|---|---|
| 1 | **Decision-ID collision** (3.01's D-129→D-133 vs 2.06's D-129→D-140) | **Already resolved** in PR #14 — renumbered +12 → D-141→D-145 with a reconciliation note | Verified; inherited. Fixed the **last stale `D-129`** refs the merge missed (the 3.01 completion report's decision list still said D-129) |
| 2 | **Divergent `current-state.md`** | **Already union-authored** in PR #14 (both 2.06 + 3.01 paragraphs) | Corrected the 3.01 paragraph's now-false claims (see Task 3), fixed the stale `D-129`, and **removed the contradictory "2.06 not yet run" carryover** + a stale "guard can't be built yet" item |
| 3 | **Overlapping validity/threshold code** (2.06 age-banded the VALUES; 3.01 the MECHANICS) | **Botched** — the merge took 3.01's resolver wholesale and **orphaned 2.06's `band.commission`** (dead code); the too-fast flag reverted to a flat 0.30 / young 0.45 / assisted 0.50 for every age | **Fixed** — the composition below |

## The threshold composition implemented (Task 3 / D-146)

| Axis | Source | Behaviour |
|---|---|---|
| **Age** (too-fast STRONG fraction) | 2.06 `ATTENTION_BANDS[].commission` | `0.40 / 0.35 / 0.30 / 0.25` by band — **the only** age input; no young relaxation of the fraction |
| **Parent-assist** (fraction) | 3.01, re-expressed | `+ TOO_FAST_FRACTION_ASSIST_DELTA (0.1)` **on top of the age band**, clamped by `TOO_FAST_FRACTION_STRONG_MAX (0.6)`. A 5–6yo's `0.40 + 0.10 = 0.50` reproduces the pre-reconciliation assisted value |
| **Device** (too-fast ms) | 3.01, unchanged | `deviceBaselineMs · 2.5`, clamped `[250, 1500]`; absolute 500 ms with no baseline |
| **Idle count** | 3.01, unchanged | Young / assisted relaxation kept — 2.06 does **not** age-band idle, so it duplicates nothing |
| **No-age fallback** | 3.01 `TOO_FAST_FRACTION_STRONG (0.3)` | Ageless edge/unit case only; `finalize` always supplies age |

**Determinism:** `finalize(state)` with no `ScoringContext` (age from state, no assist, no device) reproduces the **pure post-2.06 age-banded verdict bit-for-bit** — proven at the resolver, `computeValidity`, and `finalize` levels.

**Removed seeds:** `TOO_FAST_FRACTION_STRONG_YOUNG (0.45)`, `TOO_FAST_FRACTION_STRONG_ASSISTED (0.5)`. **Added seeds:** `TOO_FAST_FRACTION_ASSIST_DELTA (0.1)`, `TOO_FAST_FRACTION_STRONG_MAX (0.6)` — both kept **out** of `PROVISIONAL_NORMS` (mirroring 3.01's other threshold seeds), so the register's pinned key-set is untouched.

**Honest downside:** the assisted cut-off is now band-relative, so an (unusual) assisted *older* child is judged stricter than before (age 13 assisted = 0.35 vs the old flat 0.50); and a genuinely fast 5–7yo is judged on 0.40 (2.06's calibrated value) rather than 3.01's more lenient 0.45 — marginally likelier to flag. Both are the correct research-calibrated behaviour.

## D-renumbering map (old → new)

The renumber itself shipped in PR #14; this is the reference map, now complete:

| Authored (3.01 branch, pre-2.06) | Final (post-2.06 merge) | Topic |
|---|---|---|
| D-129 | **D-141** | Executed 3.01 on live 2.04 `main` |
| D-130 | **D-142** | `ScoringContext` not `ResponseTiming` widening |
| D-131 | **D-143** | Threshold modulation as new seeds + resolver |
| D-132 | **D-144** | Progress store = 3rd store, localStorage |
| D-133 | **D-145** | Cross-major comparability guard |
| — (new) | **D-146** | This phase's threshold composition |
| — (new) | **D-147** | New branch off merged `main` |

*(2.06's own D-129→D-140 are unrelated and correct — they keep those numbers.)*

## Decisions made on the fly

1. **D-146 — the threshold composition** (age from 2.06's `band.commission`; assist as `+0.1` on top; young dropped for the fraction, kept for idle; device ms unchanged; ageless fallback 0.30). *Why: age counted once from the research calibration, the two non-age axes layered on top — the only composition keeping both phases' deliverables.*
2. **D-147 — shipped on a new branch `phase-3.01R-threshold-reconcile` off the merged `main`.** *Why: the 3.01 PR already merged (#14) and can't be reopened; the fix changes production scoring so it must go through review.*

## Surprises / off-spec changes

- **The single biggest one: the phase was already ~⅔ done and merged.** The brief was written against a "3.01 unmerged, PR open" world that no longer exists. I verified this from git before changing anything and confirmed the plan with the owner rather than re-running the merge.
- **The mechanical merge silently regressed 2.06.** Dropping `band.commission` for the too-fast flag is invisible in the test suite because the two surviving too-fast tests (age 9 @ 0.40 fraction, age 5 @ 0.40 fraction) pass under *both* the 2.06 bands and the 3.01 flat/young values — a coincidental green. The new age-13 @ 0.30 discriminator would have read `ok` under the merge and reads `strong` (correct) now.
- **`00_stack-and-config.md` had no Phase 3.01 entry at all** (the append log jumped 2.06 → nothing). Added a combined 3.01 + 3.01R entry so the config surface (the validity threshold seeds) is finally logged.
- **`TOO_FAST_FRACTION_STRONG` history is non-linear:** 2.06's stack-config entry lists it as *deleted*; 3.01 re-introduced it; 3.01R keeps it (as the ageless fallback). The 2.06 append-log entry is left as-is (it was true then).

## Files written / updated

**New:**
- `src/_project-state/completions/Part-3-Phase-01R-Completion.md` — this report.

**Modified — code:**
- `src/content/norms/seed-norms.ts` — `resolveValidityThresholds` reconciled (age from `band.commission`, assist delta on top, young dropped for the fraction); removed `TOO_FAST_FRACTION_STRONG_{YOUNG,ASSISTED}`; added `TOO_FAST_FRACTION_ASSIST_DELTA` + `_MAX`; doc rewrites.
- `src/features/scoring/validity.ts` — header + `computeValidity` JSDoc rewritten to the reconciled composition (no behavioural change — the flag already reads the resolver's output).
- `src/features/scoring/finalize.ts` — the `computeValidity` call-site comment corrected.

**Modified — tests:**
- `validity-context.test.ts` — resolver assertions rewritten: ageless fallback, per-band fraction (no young double-count), assist `+delta`, young idle relaxation, clamp; device tests kept.
- `confidence-validity-extremes.test.ts` — added the older-age (band 0.25 vs 0.30) discriminator.
- `finalize-context.test.ts` — added the "no context ⇒ pure post-2.06 age-banded verdict" proofs; updated an assisted comment.

**Modified — state / docs:**
- `Decisions.md` — appended D-146, D-147.
- `current-state.md`, `file-map.md`, `00_stack-and-config.md` — union corrections (see above).
- `Part-3-Phase-01-Completion.md` — the last stale `D-129` (3.01-meaning) references fixed to `D-141`.

## Tests run + results

- **`npm test` (Vitest):** **68 files, 500 tests** — all pass (was 495; +5 reconciliation tests, none deleted).
- **`npm run build`:** green — TypeScript passes, all 10 routes generate (the `middleware`→`proxy` warning is the pre-existing D-128 carryover, unrelated).
- **Progress store (Task 4):** verified already correct on 2.0.0 — the cross-major guard tests exercise v1↔v2 (guard fires) and 2.x↔2.x (compares normally); no 1.x literal needed changing (the `"1.0.0"` literals are *intentional* prior-version fixtures proving the guard, not stale pins).

## What the owner should eyeball before merging

- [ ] **Confirm the composition is what you want** — specifically that a fast 5–7yo is now judged on 2.06's `0.40` (stricter than 3.01's `0.45`), and assisted-older is band-relative (age-13 assisted `0.35`, not `0.50`). This is the one place the fix changes real scoring.
- [ ] **This is a second PR for the same reconciliation** (the mechanical #14 + this semantic one). If you'd prefer it folded differently, say so before merge.
- [ ] The `TOO_FAST_FRACTION_ASSIST_DELTA (0.1)` / `_MAX (0.6)` seeds are new pilot-tunable knobs; they are deliberately **not** in `PROVISIONAL_NORMS` (kept consistent with 3.01's other threshold seeds) — flag if you'd rather they were tracked there.

## Blocked / carryover

- [ ] Unchanged from 3.01: report-narrative speed-style + derived attention stay absolute-thresholded (report engine out of scope, D-143); device-baseline single-tap fallback is a pilot seed; growth-comparison report UI is a later phase.
- [ ] Part 2 remainder = **2.03 (Meta/GA4, externally blocked)** + **2.05 (Vercel preview deploy)**. 2.06 is merged; there is no longer any "2.06 not yet run" work.

## What's next

Most likely **2.05 (Vercel preview deploy)** and/or the Part 3 security pass (rate-limit / anti-bot). Chat should tell Lazar: the 3.01/2.06 reconciliation is now complete in **two** PRs (the mechanical #14 already merged, this semantic one pending); the decision log runs 2.06 `D-129→D-140` → 3.01 `D-141→D-145` → reconciliation `D-146→D-147`; any further decisions continue from **D-148**.

---
*IqUp-V2 | Part 3 · Phase 01R Completion | 2026-07-04*
