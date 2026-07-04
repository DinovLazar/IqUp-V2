# Part 3 · Phase 01 — Validity / edge-case / time hardening · Completion Report

**Phase:** Part 3 · Phase 01 — Validity-flag pass, parent-assist, device-relative time, idle/tab-blur, extremes, repeat-test + anonymous local progress
**Executing Claude:** Code
**Date completed:** 2026-07-04
**Branch:** `phase-3.01-validity-hardening`
**Commits:** see PR
**PR:** _(opened against `main` — link in PR)_

## What shipped

The reliability pass: the assessment now stops handing a confident profile to a rushed/random session, stops penalising a slow-but-careful child, judges "too fast" relative to the child's own device, and lets a child retake later with fresh questions — stored privately on their own device, never on a server.

- **Validity full pass (A).** All five §7.1 flags were already implemented (1.05, D-063); this phase makes their **time-based thresholds context-aware** — age-banded (young 5–7 relaxed), parent-assist-relaxed, and **device-relative** — via a pure `resolveValidityThresholds(ctx)` resolver, with the base case byte-identical to 1.05. `strong` still routes to the graceful-retry report branch.
- **Parent-assist activated (B).** `parentAssistMode` was inert; it now relaxes the too-fast fraction + idle-count thresholds so an assisted 5–7 session that flags `strong` unassisted comes back `ok`/`mild`.
- **Device calibration consumed (C).** The captured-but-inert session `DeviceCalibration` (D-071) now drives a **device-relative** too-fast threshold (scales with the tap baseline, clamped), so the same *relative* speed gets the same verdict on a fast vs a slow device.
- **Idle / tab-blur hardened (D).** Confirmed idle **and** `visibilitychange` both record gaps that `effectiveTime` excludes and can raise the idle-count flag; proved the ~22 s nudge is timer-free and penalty-free — with an end-to-end blur→grade→validity test.
- **Extremes separated (E).** A genuine engaged-but-struggling **floor** session now provably reads differently from a **masher**: floor keeps a gentle, confident profile; the masher gets `strong` → retry. The **verdict** is the distinguisher.
- **Repeat-test + anonymous local progress (F).** New `src/features/progress/` tree: a repeat derives a **fresh seed** (new item set, no repeated questions), and each finished run's **anonymous, PII-free summary** is persisted **on-device** (`localStorage`) with the three version stamps + set seed. A **cross-major guard** (D-134) degrades to "new version, fresh profile" with no numeric comparison. A clean, tested **read API** is exposed but **not rendered** (report UI is a later phase).

## Inventory (Task 1) — what already fired vs. what was added

| §7.1 flag / feature | Before (1.05, D-063) | This phase (3.01) |
| --- | --- | --- |
| too-fast (>30% ⇒ strong) | ✅ absolute 500 ms | **device-relative** threshold + **age/assist-relaxed fraction** |
| same-position (>60%) | ✅ | unchanged (not time-based) |
| excessive-idle-count (>3) | ✅ | **age/assist-relaxed count** |
| Gs mashing (≥90% cells) | ✅ | unchanged |
| chance-level accuracy / domain | ✅ | unchanged |
| verdict ok/mild/strong → retry branch | ✅ | unchanged (routing re-tested end-to-end) |
| idle **+** tab-blur gap exclusion | ✅ (mechanics in stopwatch) | **verified + tested** end-to-end; nudge penalty-free proven |
| ceiling / floor extremes | ✅ | **floor-vs-invalid separation** added + tested |
| `parentAssistMode` | captured, **inert** | **consumed** by scoring |
| device calibration baseline | captured, **inert** (D-071) | **consumed** (device-relative too-fast) |
| repeat-test new-set | — | **added** (fresh derived seed) |
| anonymous on-device progress + cross-major guard | — | **added** (`src/features/progress/`) |

## Decisions made on the fly

Logged in `Decisions.md` as **D-129 … D-133** (the live log ended at **D-128**, so numbering starts at D-129 — **not** the brief's D-141, which assumed 2.06/2.03 had added D-129…D-140).

1. **D-129 — Executed on the live 2.04 `main`, reconciling the brief's stale "2.06 merged" premise.** `main` is at end of **2.04**; 2.06/2.03 have **not** run and PR #13 does not exist. The scaffolding this phase hardens all exists from 1.05/1.06/2.01, so it is fully executable now. Ran 3.01 ahead of 2.05/2.03 **and** 2.06 at the owner's explicit direction (surfaced + confirmed at kickoff). Every 2.06 reference mapped to the live equivalent (`PROVISIONAL_NORMS`→seed-norms, D-133/134/138/139→D-063/D-071/version-stamps). *Live code wins (CLAUDE.md).*
2. **D-130 — Did not widen the per-item `ResponseTiming`/`CapturedTiming` contract** (D-071's open question); parent-assist + device baseline reach scoring via a new session-level `ScoringContext` on `finalize(state, context?)`. Base case unchanged.
3. **D-131 — Age/assist/device threshold modulation added as NEW labelled seed constants + a pure resolver;** the 1.05 seed VALUES are unchanged. Device-relativity is scoped to the **validity verdict** (in scope); the report's narrative speed-style + the derived attention signal keep the grade-time absolute `tooFast` (report engine is out of scope) — deferred.
4. **D-132 — The on-device progress store uses `localStorage` (a tiny JSON blob), not IndexedDB;** a THIRD store, unjoinable to Store A/B, pure-core / thin-IO split, PII-free by strict schema.
5. **D-133 — The cross-major comparability guard keys on `TASK_BANK_VERSION` major only** and yields a numeric-free fallback (realises the brief's D-134 intent).

## Surprises / off-spec changes

- **The brief's context described a repo state that does not exist.** It assumed Phase 2.06 (task bank v2) had merged and referenced `PROVISIONAL_NORMS` and decisions D-133/D-134/D-138/D-139 that are absent from the live tree (`Decisions.md` ends at D-128; `seed-norms.ts` has no `PROVISIONAL_NORMS`/`ATTENTION_BANDS`). Surfaced to the owner before coding; proceeded on the live 2.04 code per their choice. This is the single biggest deviation and the reason the decision log starts at D-129, not D-141.
- **`npm run build` requires the Supabase env vars** (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) to prerender the 2.04 `/admin/login` page. This is pre-existing 2.04 behaviour, unrelated to 3.01; with the vars present the build is green (all 10 routes generate; `/procena` — which holds this phase's flow wiring — builds static).
- **Device baseline nuance (seed, flagged for the pilot):** `summarizeCalibration` returns first-tap *latency* for a single tap (D-071's spec), which conflates reading+thinking with tap cadence. In practice the first Gf practice item is select-then-confirm (≥2 taps, D-074) → the reliable median inter-tap gap is used; the single-tap path is a rare fallback bounded by the clamp ceiling. The threshold clamp `[250, 1500]` means device-relativity is *exact* only inside that band (documented in code + test).

## Files written / updated

**New — `src/features/progress/` (anonymous on-device progress, spec Дел 14.2):**
- `schema.ts` — strict Zod `storedProfileSchema` + `StoredProfile`, `isStoredProfile`, `STORED_PROFILE_KEYS` (no-PII by construction)
- `summary.ts` — pure `buildStoredProfile`
- `repeat.ts` — pure `nextRepeatSeed` / `sessionSeedFor` (fresh derived seed ⇒ new item set)
- `compare.ts` — pure `compareToPrior` + `majorVersion`/`isCrossMajor` (cross-major guard, D-133)
- `storage.ts` — the sole browser touchpoint: defensive `localStorage` adapter (fails soft)
- `index.ts` — barrel + composed read API (`loadPriorProfile`/`resolveSessionSeed`/`saveSessionProfile`/`readGrowth`)
- `__tests__/{summary,repeat,compare}.test.ts` (Node) + `storage.test.tsx` (jsdom) + `guards.test.ts` (static unjoinable/isolation scan)

**New — tests:**
- `src/features/scoring/__tests__/validity-context.test.ts` — resolver + wired verdict (age/assist/device)
- `src/features/scoring/__tests__/finalize-context.test.ts` — `ScoringContext` end-to-end threading + determinism
- `src/features/scoring/__tests__/extremes-floor-vs-invalid.test.ts` — floor vs masher separation
- `src/features/timing/__tests__/idle-blur.test.ts` — idle/tab-blur end-to-end + penalty-free nudge

**Modified:**
- `src/content/norms/seed-norms.ts` — `resolveValidityThresholds(ctx)` + new modulation seeds (D-131)
- `src/features/scoring/validity.ts` — `computeValidity(items, ctx?)` device-relative + context-modulated
- `src/features/scoring/finalize.ts` — `finalize(state, context?)` + `ScoringContext` (D-130)
- `src/features/scoring/index.ts` — export `ScoringContext`
- `src/app/(site)/procena/assessment.tsx` — consume `parentAssistMode` + device baseline in `finalize`; wire on-device progress (read prior → repeat seed; save summary after finalize)
- `Decisions.md` (D-129…D-133), `src/_project-state/current-state.md`, `src/_project-state/file-map.md`

## Tests run + results

- `npm test` — **439 passed (66 files)** — up from 392 (57 files); **+46 new tests / +9 files** this phase. All prior suites green (base-case identity preserved).
- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run format:check` — clean.
- `npm run build` — green **with the Supabase env vars set** (required by the 2.04 admin page; absent them, only the untouched `/admin/login` prerender fails). All 10 routes generate; `/procena` builds static.
- **Internal adversarial self-review** (CodeRabbit + Codex still not connected): a multi-dimension adversarial pass over the diff (correctness, privacy/non-joinability, determinism/purity, repeat logic, cross-major guard, wiring, spec/brand, test quality). **No must-fix.** The confirmed should-fix/nit items were all fixed: two now-stale comments in `assessment.tsx`; a latent read-after-save ordering note for the future growth-UI phase; a strengthened device-relativity test (both baselines inside the clamp band); a more honest `finalize`-threading test title; a content-level (not just seed-level) repeat-freshness assertion; a corrected no-PII guard note (`setSeed` is intentional, join-free).

## Definition of Done

- [x] Every §7.1 flag implemented + unit-tested; correct graduated verdict; `strong` → graceful-retry branch. Report lists present-vs-added (inventory table above).
- [x] `parentAssistMode` consumed (§7.4); assisted slow 5–7 session `strong` unassisted → `ok`/`mild` assisted (age held fixed). No longer inert.
- [x] Session **device baseline** from the first practice item drives a **device-relative** too-fast threshold (§7.2, D-071); two different-baseline devices get comparable relative verdicts (tested). Contract decision made + logged (**not** widened — D-130).
- [x] Idle **and** tab-blur record gaps `effectiveTime` excludes; ~22 s nudge timer-free/penalty-free; over-threshold gaps drop from time + can raise the idle-count flag — tested incl. a blur path.
- [x] Extremes: ceiling "at least this high"; floor gentle "too new"; floor distinguished from invalid via the verdict — both tested.
- [x] Repeat generates a new item set via a fresh derived seed (no repeated items); determinism + freshness tested (incl. different first-item content).
- [x] Anonymous browser-local profile persists the prior summary + three version stamps + set seed; no PII, no join (asserted by tests/guards); a repeat reads it via a tested API.
- [x] Cross-major guard (D-134): stored task-bank major ≠ current ⇒ graceful "new version, fresh profile", no numeric comparison; tested with a stored v1 vs an injected v2.
- [x] Determinism preserved end-to-end; existing determinism/purity suites green; the new persistence is isolated from the pure layers (guard test).
- [x] No changes to seed-norm VALUES, the report engine, the admin panel, the DB schema, or API security (rate-limiting stays out, carryover below).
- [x] `build` (with env) / `lint` / `typecheck` / `test` / `format:check` pass; new tests per workstream; `current-state.md` + `file-map.md` updated; decisions logged from D-129; PR opened against `main`.

## Blocked / carryover

- [ ] **Rate-limit / anti-bot on `/api/lead`, `/api/score`, `/api/admin/export`** — still deferred to a later Part 3 security pass (spec §19.3), as this brief scoped out. Unchanged by 3.01.
- [ ] **Growth-comparison report UI** — this phase ships the storage + cross-major guard + read API only. When the report phase renders growth, it must read the prior **before** the post-finalize save (see the ORDERING note at the save site in `assessment.tsx`) so it doesn't self-compare.
- [ ] **Report narrative speed-style + attention are still absolute-thresholded** (grade-time `tooFast`). Making them device-relative belongs with the report-engine phase (out of scope here) — a clean follow-up if desired (D-131).
- [ ] **Device-baseline single-tap fallback** conflates reading+thinking with tap cadence — a seed to recalibrate with pilot data; bounded by the clamp ceiling meanwhile.
- [ ] **Phase 2.06 (task bank v2) + 2.03 (analytics) + 2.05 (deploy) still un-run** — 3.01 was executed ahead of them (D-129). When 2.06 later lands, its `taskBankVersion` **major** bump is exactly what the cross-major guard was built for.

## What's next

Per the owner's sequencing, likely the remaining Part 2 work (2.06 task bank v2, 2.03 analytics, 2.05 deploy) and/or the later Part 3 security pass (rate-limit / anti-bot). Chat should note to Lazar that 3.01 ran ahead of 2.06/2.03/2.05 and that the decision log now runs D-129→D-133 (not the brief's D-141), so any pending 2.0x decisions continue from D-134.

---
*IqUp-V2 | Part 3 · Phase 01 Completion | 2026-07-04*
