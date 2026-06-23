# IqUp-V2 — Current State

> A live snapshot of the repo. **Claude Code updates this at the end of every phase.** It is the single source of truth for "where are we." If this and a planning doc disagree, this (the live state) wins.
>
> Lives at `src/_project-state/current-state.md`.

**Last updated:** 2026-06-23 — end of Phase 1.07 (Report engine)
**Current part / phase:** Part 1 · Phase 1.07 complete → next is **1.08 (Confirmation screen + lead form)**
**Active branch:** `phase-1.07-report-engine` → PR into `main` (awaiting Lazar's merge)

> The assessment runs **end-to-end locally**: `/` → setup → pre-start → practice (with calibration) → all 7 task types adaptively (on the 1.05 engine) → completion + reward badge. **1.07 adds the report engine:** the 1.05 `AssessmentResult` is turned into a deterministic, parent-facing `ReportModel` (top strength + growth + solving style + STEM bridge + positioning + dynamic CTA), assembled from a versioned MK module library with no AI. Five fixtures → five visibly distinct reports, viewable at `/kit`. Nothing is persisted before the (1.08) form.

## How to run it locally

```bash
npm install
npm run dev        # http://localhost:3000  → real landing (MK) → /procena runs the assessment
                   # http://localhost:3000/kit → dev-only UI-kit gallery (every component + every task renderer)
npm test           # Vitest: task bank + engine + scoring + timing + renderers + flow + report (23 files, 169 tests)
npx tsx scripts/dump-tasks.ts   # print sample generated items as JSON (eyeballing)
```

Quality scripts: `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run format` / `format:check`. All pass as of this phase.

## Tech stack (current — installed & pinned)

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) · Tailwind CSS v4 (CSS-first; brand `@theme` in `globals.css`) · shadcn/ui on Radix (`radix-ui`), fully **restyled to brand** · Motion (`motion` v12, LazyMotion) · Lucide · next-intl 4 (MK at root) · **Montserrat via `next/font/google`** (latin + cyrillic) · **Vitest 4.1.9** (test runner, added 1.04) · Prettier + ESLint. Exact versions and config notes: `00_stack-and-config.md`. **Deferred** (added in their phase): React Hook Form + Zod (1.08), @react-pdf/renderer (1.09), Supabase/Brevo/Meta/GA4 (Part 2).

## Pages built

- `/` — **real landing** at `src/app/(site)/page.tsx` (1.06): brand hero, value message, MK/EN switch (MK active, EN inert), dashed class-photo placeholders (Cowork swaps in later), "Започни проценка" → `/procena`, inline "informative, not diagnostic" footnote, puzzle-brain accent.
- `/procena` — **the assessment flow** (1.06): setup (age 5–13; <5/>13 blocked; no child name) → pre-start (instructions + mandatory 5–7 parent confirm + inline disclaimer) → practice/real on the 1.05 engine → completion + reward badge. Browser-memory only; nothing persisted.
- `/kit` — **dev-only UI-kit gallery** at `src/app/kit/`. Every component + state, pentagon, puzzle-brain, every 1.06 task renderer (live), answer-option states, idle nudge, reward badge, **+ the 1.07 report preview: all five `fixtures.ts` profiles assembled through `assembleReport` (pentagon + bands + strength/growth/style/activities + Part Б + positioning + CTA; strong-invalid → graceful-retry; ceiling → ceiling copy; static Прилог D.4 disclaimer placeholder).** `noindex`; 404s on real production; not linked from nav.
- Reserved (empty `.gitkeep` route folders): `(site)/za-testot`, `(site)/politika-za-privatnost`, `(site)/uslovi`, `admin`, `embed`, `api`.

## Components built (`src/components/ui/`)

Full brand kit on shadcn/Radix + Tailwind v4, each with its complete state set:

- `button.tsx` — primary / secondary / ghost; sizes default(48px)/lg/icon; hover/active/focus-visible/disabled.
- `card.tsx` — Card (default + emphasis surfaces) + Header/Title/Description/Content/Footer. No shadow.
- `badge.tsx` — 30px explorer/reward pill (filled + soft), icon-friendly.
- `progress.tsx` — word-labelled track, `--grad-brand` fill (Radix Progress).
- `input.tsx`, `label.tsx`, `field.tsx` (Field/FieldHelpText/FieldError), `checkbox.tsx` (consent style — never pre-ticked, error-ready), `select.tsx` (Radix Select; popover uses `--shadow-pop`).
- `band-label.tsx` — index band-label: **word + indicative range only, no number** (`*-ink` colored, 4-step glyph).
- `confidence-label.tsx` — висока/средна/ниска + 3-bar signal glyph.
- `index-band-bar.tsx` — per-index row: dot + name + word pill + colored track + indicative range (+ optional confidence).
- `pentagon.tsx` — web SVG over the pure geometry module; color dots + MK vertex labels; PDF-safe primitives.
- `puzzle-brain.tsx` — Motion (LazyMotion) clipped-silhouette + 5 region assembly from a `completed` (0–5) prop; reduced-motion snap fallback; ~40px chip variant; optional word-labelled track.
- **`answer-option.tsx`** (1.06, D-047) — shared task-agnostic option control: select + violet check disc + correct/incorrect feedback; ≥64px square.
- **`idle-nudge.tsx`** (1.06, D-047) — gentle "Сè е во ред?" prompt + Продолжи; overlay or inline; light-blue, no timer/penalty.
- **`reward-badge.tsx`** (1.06, D-047) — "IQ UP! Истражувач" violet tile + custom yellow-star SVG + child-facing line.

**Shared lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks). Imported by pentagon, band bars, confidence, brain — and PDF-safe for 1.09.
- `pentagon.ts` — **pure, framework-agnostic** pentagon geometry (vertices/profile/rings/spokes/labels). One module feeds both the web component and the future `@react-pdf` report (1.09).
- `utils.ts` — `cn()` helper (unchanged).

## Task bank (`src/features/tasks/`, `src/content/tasks/`, `src/lib/prng.ts`) — Phase 1.04

Deterministic, seedable procedural generators for the **7 testable signals**, emitting **pure data / coordinate geometry** (no React, no SVG, no CSS — mirrors `pentagon.ts`). One entry point, `generateItem({ signal, level, seed, practice?, ...opts })`, plus `generatePractice(signal, seed)`; a signal→generator `REGISTRY`; type guards in `guards.ts`. Same inputs → deep-equal item, always.

- **`prng.ts`** — the one randomness source: `makeRng` (mulberry32 + FNV-1a), `pick`/`shuffle`/`pickN`/`intInRange`/`chance`, and `deriveSeed` (so 1.06 derives per-item seeds from one session master seed). No `Math.random`/`Date`/env anywhere downstream (purity-tested).
- **`content/tasks/`** — `TASK_BANK_VERSION = "1.0.0"` (stored per record, spec Дел 19.4) + per-domain level 1→10 difficulty tables (the single place difficulty is tuned).
- **Generators** — `gf` (matrix + numeric series), `gv` (mental rotation + odd-one-out, chiral polygons), `gsm` (Corsi span, fixed 6-tile board, caller passes length/direction), `gs` (symbol-search grid + target-cell key), `ef` (Tower of London, BFS-verified `minMoves` + optimal path), `glr` (paired-associate study + recall), `ct` (5 sub-types: sequence/debug/loop/condition/maze, all symbol-based, zero text).
- **Attention has NO generator** — it is a derived signal (timing variability + misses + impulsive errors) computed in 1.05 (spec Дел 3.1 #5 / Дел 4). Documented in `types.ts`.
- **Tests** — Vitest suite under `__tests__/` (6 files, 41 tests): determinism, full level/subtype coverage, answer-key correctness (independent BFS for EF, rule re-derivation for Gf, congruence for Gv, maze-is-a-tree, etc.), distractor validity (unique key, matrix distractors differ by exactly one attribute), and a purity/language-neutrality scan.
- **Out of scope (1.06):** all timers/timing *behaviour* (stopwatch, idle/tab-blur detection, the gentle nudge), practice-item administration, device calibration, and rendering — 1.05 consumes timing as passed-in data only.

## Adaptive engine + scoring + seed norms (`src/features/assessment/`, `src/features/scoring/`, `src/content/norms/`) — Phase 1.05

The **brain** of the assessment: a pure, deterministic, UI-free state machine + scoring layer that turns a child's responses into the five parent-facing indices with bands, confidence, validity, and extremes. No clock, no randomness beyond the seeded PRNG, no React — same `sessionSeed` + age + response/timing script → **deep-equal `AssessmentResult`**, always (purity- and determinism-tested, mirroring 1.04).

- **`content/norms/seed-norms.ts`** — the **single tuning surface**: start-level-by-age, expected spans, item caps, the idle/validity/confidence thresholds, composite weights, and the raw→index formula constants. **Every value is a labeled seed** to recalibrate from pilot + anonymous data (Дел 6.6). `SCORING_VERSION` + `NORMS_VERSION` = `1.0.0`, carried in `result.meta` with `normsStage: "seed"`.
- **`features/assessment/`** — `startSession` → `nextAction` (selector) → `applyResponse` (reducer) → `advanceDomain`, plus a `runSession` driver. Three control flows behind one interface: laddered basal/ceiling (Gf, Gv, EF, CT), span-adaptive Corsi (Gsm; +1/−1, backward only from age 8), and fixed age-sized (Gs, Glr). Per-item seeds via `deriveSeed`; each administered item comes from `generateItem`. Plus **`fixtures.ts`** — five reusable scripted profiles (logic-strong / spatial-strong / flat / ceiling / strong-invalid), reused by 1.07.
- **`features/scoring/`** — grade (correctness derived from the item's own key, never from time) → raw scores (Дел 6.1) → derived **attention** (variability + impulsive errors; no task) → raw→0–100 (3 families) → composites (Дел 6.3) → bands (Дел 6.4) → confidence (Дел 6.5) → validity flags + verdict (Дел 7.1) → extremes (Дел 7.3), assembled by `finalize`. **Slow ≠ wrong** is structural: only Gs scoring sees time.
- **Output feeds the UI kit with no adapter** — `AssessmentResult.indices` is keyed by the `lib/indices` `IndexKey` and the band/confidence enums are imported *as types* straight from the 1.03 components (so any drift breaks the build).
- **Tests** — 7 new Vitest files (engine path, determinism, formulas, confidence/validity/extremes, attention + slow≠wrong, five-profiles/UI-shape, purity). One bug caught by an adversarial review pass (Gsm floor/ceiling mutual-exclusivity) was fixed + regression-tested.

## Assessment flow UI (`src/features/timing/`, `src/features/assessment/tasks/` + `flow.ts`, `src/app/(site)/procena/`) — Phase 1.06

The test becomes something a child can take. Built on the same pure-core / thin-React split as `pentagon.ts` vs `pentagon.tsx`:

- **Timing layer (`src/features/timing/`)** — a pure silent stopwatch + idle/tab-blur gap recorder over injected timestamps (`stopwatch.ts`, node-tested), pure device calibration (`calibration.ts`), and ONE React hook `use-item-timer.ts` that owns the app's only clock (`performance.now`). Output is the engine-shaped `{ elapsedMs, idleGaps? }` fed straight into `applyResponse`. Lives outside `src/features/assessment` so the hook's clock never trips the 1.05 purity scan (D-070). Nudge at 22 s, suppressed during Gs (D-072).
- **Task renderers (`src/features/assessment/tasks/`)** — one per signal (Gf, Gv, Gsm/Corsi, Gs/speed-grid, EF/Tower-of-London, Glr/paired-associate, CT/5 sub-types), each a thin render of `generateItem` output over a pure `view.ts` (presenters + response builders + `instructionKey`). Shared SVG `glyphs.tsx`. `TaskRenderer` dispatches by signal; `TaskScreen` wraps any renderer with progress chrome + the silent stopwatch + the idle nudge. **Correctness derives from the answer key, never time** — only the Gs timer is visible (calm orange ring); no countdown anywhere else.
- **Flow (`flow.ts` + `procena/`)** — a pure running-phase controller (`settle` past domainComplete, `nextStep` = practice/real, 5 index-group progress, D-073) and the React state machine (`assessment.tsx`): setup → pre-start → practice (one per task type, skippable; first calibrates) → adaptive sections → completion + reward. `parentAssistMode` plumbed but inert (3.01); device calibration captured but inert (no field in the 1.05 `ResponseTiming` — D-071, flagged not silently added).
- **Tests** — 3 new Vitest files (32 tests): timing (idle/finish/calibration + scoring contract), response→answer-key per signal (slow≠wrong), and the flow over the 5 `fixtures.ts` profiles (reproduces the engine path, deterministic, one practice per task type).

## Report engine (`src/features/report/`, `src/content/modules/`) — Phase 1.07

The piece that turns the five computed indices into a **personalized, deterministic report** — top strength, main growth area, observed solving style, the STEM bridge, expert IQ UP! positioning and a dynamic demo-class CTA — assembled with **no AI** from a versioned MK module library. Same `AssessmentResult` in → **deep-equal `ReportModel`** out; five fixtures → five visibly different reports (purity- + determinism-tested, mirroring 1.04/1.05). The engine **consumes 1.05's indices / bands / confidence / validity READ-ONLY** — it never recomputes a score, only narrates one (Дел 9).

- **`features/report/`** — three pure layers + the contract: `features.ts` (Дел 9.1 derived features: profile shape, top-strength + primary-growth index, the **behaviour-only** speed-accuracy style, memory forward/backward asymmetry, learning slope, extremes, STEM-bridge lead, positioning tier — narrative thresholds are report-local seeds, never scoring norms, D-081); `assemble.ts` (`assembleReport` — slot selection with a **total-order** tie-break of priority → lib/indices order → id, so output never depends on sort stability); `text.ts` (the pure `{child}` → „вашето дете" resolver, D-078); `select.ts` (`selectReportSummary` — the 10.1 on-screen subset: pentagon + 5 bands + top strength + CTA); `program.ts` (Дел 11 / Прилог E age→program mapping); `types.ts` (`ReportModel` — the single render contract for 1.08 + 1.09: `meta` with report-engine + module-library + scoring + norms versions, the parent-facing per-index presentation, Part А, Part Б, positioning, CTA **text** only). The input contract needed **no widening of 1.05** — `SignalResult.perItem` + aggregates already exposed everything (D-080).
- **`content/modules/`** — the **versioned MK module library** (`MODULE_LIBRARY_VERSION = "1.0.0"`): strengths (per index × band), growth (no-attack frame + an „all strong" variant), solving styles (4), STEM readiness (by band) + STEM bridge (spatial/logic/CT-led, broader than coding), per-index home activities (every index, not just the growth zone), positioning (5 programs + fallback, Прилог E voice; the program name shows, the age→program logic stays internal as `programHook`), dynamic CTAs (by growth zone), extremes (ceiling/floor), validity (mild soft-note + strong graceful-retry). **A fallback per category** so no reachable profile yields a blank section. Authored to the brand §9 voice; **never a number**, never „слабост/проблем/заостанува", never „клинички IQ".
- **Validity branch** — a **strong** flag yields `variant: "retry"` (the graceful retry message + a „Повтори" affordance, **no confident profile**, Дел 7.1); **mild** keeps the full profile and appends the soft note; **ceiling** shows the positive „го достигна врвот…" copy.
- **Tests** — 7 new Vitest files (36 tests): determinism (deep-equal), purity scan (no clock/random/env in `report/` + `modules/`), **five profiles → five distinct reports**, validity + extremes (strong→retry, mild note, ceiling copy), per-index activity coverage + non-empty Part А/Б/positioning/CTA, the **voice lint** (banned-token substring check, „IQ UP!" allow-listed, D-082), and the `{child}` resolver. Repo total: **23 files, 169 tests.**

## Design tokens

All handover §1 / spec App. G tokens are in the Tailwind v4 `@theme` (`src/app/globals.css`): 8 palette colors + per-index soft tints + `*-ink` text variants, gradients, surface/border/focus/state tokens, the four Montserrat type roles, the 4/8/12/16/24/32 spacing scale, 12–18/30/11px radii, ≥44px tap minimum, and the single `--shadow-pop`. No dark mode.

## Integrations wired

None yet (all stubbed until Part 2).

## Repo / infra

- GitHub: `DinovLazar/IqUp-V2` — **public**, branch protection on `main`.
- CodeRabbit config committed (`.coderabbit.yaml`). **One-time app-connect for CodeRabbit + Codex still pending** — `docs/ai-review-setup.md`.
- No Vercel connection / deploy yet (Part 2).

## Open carryover items

- [x] ~~Merge the 1.01 PR first (D-041)~~ — **resolved:** PRs #1–#3 are merged into `main`; the chain is collapsed (see D-069).
- [ ] **Connect the CodeRabbit + Codex GitHub Apps** to `DinovLazar` → `docs/ai-review-setup.md`. Until done, PRs get no automated review (this 1.05 PR included — self-reviewed + an internal adversarial review pass instead).
- [ ] **Ratify D-027** (Code kept on-disk `CLAUDE.md`/`AGENTS.md`/`Decisions.md` over the Appendix drafts).
- [ ] **Brand assets pending (Cowork):** real IQ UP! class photo(s) (dashed placeholders in place); optional self-hosted Montserrat woff2 (currently `next/font/google` — clean swap path to `next/font/local`).
- [x] ~~**§4.2 extras deferred (D-047):** reward badge, answer option, idle nudge~~ — **built in 1.06** (`reward-badge.tsx`, `answer-option.tsx`, `idle-nudge.tsx`).
- [ ] **Timing-shape mismatch flagged (D-071):** the 1.05 `ResponseTiming` has no calibration field; the device baseline is captured at session level (inert) for 3.01 to consume. Decide in 3.01 whether to extend the contract.
- [ ] **Booking URL still a pending Cowork asset (1.08/1.09).** The report engine carries CTA **text only**; the booking URL + `?grad={city}` are assembled downstream once the URL lands.
- [ ] **Disclaimer left to 1.10.** 1.07 did not build the shared „informative, not diagnostic" component or embed it in `ReportModel`; the `/kit` preview shows the canonical Прилог D.4 text once, as a static placeholder.
- [ ] `notion-checklist.md` referenced in planning docs but not in the repo (owned by Chat).

## Known issues

- None. The inert shadcn `.dark` block flagged after 1.01 is **removed** (D-043). The puzzle-brain silhouette/region paths are an original interpretation of §2 (mockup not in repo, D-045) — swappable for the mockup's exact geometry later without API changes.

---
*Update procedure: at the end of each phase, refresh the "Last updated", "Current part / phase", and "Active branch" lines, then update each section to reflect what now exists. Keep it factual and current — this file mirrors reality, not the plan.*
