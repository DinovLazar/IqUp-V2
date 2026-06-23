# IqUp-V2 — File Map

> A living map of every file in the repo with a one-line description. **Claude Code maintains this:** when you add, move, or delete a file, update this map in the same phase. Keep entries to one line each, grouped by folder, in path order.
>
> Lives at `src/_project-state/file-map.md`.

*Empty at kickoff — the repo hasn't been scaffolded yet. Phase 1.01 seeds this with the initial tree.*

## Format

```
path/to/file.ext — one-line description of what it does
```

## Map

**Project root docs (placed at kickoff):**
- `CLAUDE.md` — repo rules any Claude/agent reads first
- `AGENTS.md` — short cross-agent mirror of CLAUDE.md
- `project-instructions.md` — orchestrator rulebook (Claude Chat)
- `plan.md` — target master spec
- `phase-plan.md` — phase index
- `brand.md` — brand guide
- `Decisions.md` — append-only decision log
- `notion-checklist.md` — paste-into-Notion phase checklist

**Root config & housekeeping (Phase 1.01):**
- `README.md` — short project readme + how to run locally
- `.gitignore` — Next.js defaults + `.env*` (keeps `*.example`) + `.DS_Store`
- `.env.local.example` — env variable shapes only (no secrets); real keys live in Vercel
- `.coderabbit.yaml` — CodeRabbit auto-review config (live once the app is connected)
- `package.json` / `package-lock.json` — deps + scripts (dev/build/start/lint/typecheck/format)
- `tsconfig.json` — TypeScript config (strict)
- `next.config.ts` — Next config wrapped with the next-intl plugin
- `next-env.d.ts` — Next-generated types (gitignored content; file tracked)
- `postcss.config.mjs` — PostCSS → `@tailwindcss/postcss` (Tailwind v4)
- `eslint.config.mjs` — ESLint flat config (Next core-web-vitals + TS)
- `.prettierrc.json` — Prettier + `prettier-plugin-tailwindcss`
- `.prettierignore` — excludes deps/build/lockfile/PDF/Markdown
- `components.json` — shadcn/ui config (radix lib, Nova preset, neutral, Lucide)
- `vitest.config.ts` — Vitest config (Phase 1.04): node env, `@/` alias, `src/**/*.test.ts`

**Docs:**
- `docs/design-handovers/.gitkeep` — reserved for Design handovers
- `docs/design-handovers/Part-1-Phase-02-Handover.md` — 1.02 design handover (visual source of truth for 1.03/1.06/1.07)
- `docs/ai-review-setup.md` — one-time CodeRabbit + Codex connect runbook (for Cowork)

**i18n:**
- `messages/mk.json` — Macedonian strings (starter set)
- `src/i18n/request.ts` — next-intl request config (locale `mk`, no routing yet)

**App (routes + backend):**
- `src/app/layout.tsx` — root layout; loads Montserrat via `next/font`, sets `<html lang>` + font var, wraps in `NextIntlClientProvider`
- `src/app/globals.css` — Tailwind v4 entry + **brand `@theme`** (all design tokens; shadcn semantic tokens mapped to brand; no dark mode)
- `src/app/favicon.ico` — placeholder favicon (rebranded later)
- `src/app/(site)/page.tsx` — **real landing** (1.06): brand hero, value message, MK/EN switch (MK active), dashed photo placeholders, "Започни проценка" → `/procena`, inline "informative, not diagnostic" footnote
- `src/app/(site)/procena/page.tsx` — assessment route (server); renders the client `Assessment` (1.06)
- `src/app/(site)/procena/assessment.tsx` — client flow state machine: setup → pre-start → practice/real (on the 1.05 engine) → completion; session seed + `parentAssistMode` (inert) (1.06)
- `src/app/(site)/procena/setup-screen.tsx` — age gate 5–13 (<5/>13 blocked, MK message; `noValidate`); no child name (1.06)
- `src/app/(site)/procena/prestart-screen.tsx` — instructions + mandatory 5–7 parent screen + confirmation checkbox + inline disclaimer (1.06)
- `src/app/(site)/procena/completion-screen.tsx` — "Тестот е завршен" + assembled puzzle-brain + reward badge (1.06)
- `src/app/(site)/{za-testot,politika-za-privatnost,uslovi}/.gitkeep` — reserved public pages
- `src/app/kit/page.tsx` — dev-only UI-kit gallery route (noindex; 404 on production); renders `KitGallery`
- `src/app/kit/kit-gallery.tsx` — client gallery: every component + state, pentagon samples, puzzle-brain across progress; +1.06: every task renderer (live), answer-option states, idle nudge, reward badge; **+1.07: the report-engine preview section**
- `src/app/kit/report-preview.tsx` — dev-only report preview (1.07): all five `fixtures.ts` profiles assembled through `assembleReport` (pentagon + bands + Part А/Б + positioning + CTA; retry + ceiling variants; static Прилог D.4 disclaimer placeholder)
- `src/app/admin/.gitkeep` — reserved admin panel (Part 2)
- `src/app/embed/.gitkeep` — reserved embeddable flow
- `src/app/api/.gitkeep` — reserved serverless backend (lead/report/score)

**Components (`src/components/ui/`) — brand kit on shadcn/Radix:**
- `button.tsx` — Button: primary / secondary / ghost, full state set
- `card.tsx` — Card (default + emphasis) + Header/Title/Description/Content/Footer
- `badge.tsx` — 30px explorer/reward pill (filled + soft)
- `progress.tsx` — word-labelled track with `--grad-brand` fill (Radix Progress)
- `input.tsx` — text input with focus + error states
- `label.tsx` — form label (Radix Label)
- `field.tsx` — Field wrapper + FieldHelpText + FieldError (no form logic)
- `checkbox.tsx` — consent checkbox (never pre-ticked; error-ready) (Radix Checkbox)
- `select.tsx` — Select trigger/content/item/etc. (Radix Select; popover uses `--shadow-pop`)
- `band-label.tsx` — index band-label: word + indicative range only (no number)
- `confidence-label.tsx` — висока/средна/ниска chip + signal glyph
- `index-band-bar.tsx` — per-index row: dot + name + word pill + colored track + range
- `pentagon.tsx` — web SVG pentagon over the geometry module
- `puzzle-brain.tsx` — Motion puzzle-brain assembly (+ chip variant; reduced-motion fallback)
- `answer-option.tsx` — shared task-agnostic answer option (select + check disc + feedback states) (1.06, D-047)
- `idle-nudge.tsx` — gentle idle nudge ("Сè е во ред?" + Продолжи), overlay/inline, no timer/penalty (1.06, D-047)
- `reward-badge.tsx` — "IQ UP! Истражувач" celebratory tile + custom yellow star SVG (1.06, D-047)

**Lib (`src/lib/`):**
- `indices.ts` — single source of the 5 indices (order, MK labels, hex colors/tints/inks); PDF-safe
- `pentagon.ts` — pure framework-agnostic pentagon geometry (shared by web + future PDF)
- `prng.ts` — seeded PRNG (mulberry32 + FNV-1a) + helpers (`pick`/`shuffle`/`intInRange`/`deriveSeed`); the only randomness source for the task system
- `utils.ts` — `cn()` className helper

**Task bank — versioned config (`src/content/tasks/`) (Phase 1.04):**
- `version.ts` — `TASK_BANK_VERSION` ("1.0.0"); stored with every anonymous record
- `levels.ts` — per-domain level 1→10 difficulty tables + accessors (the single place difficulty is tuned)
- `index.ts` — barrel (version + level tables)

**Task bank — generators (`src/features/tasks/`) (Phase 1.04) — pure data/geometry, no React:**
- `types.ts` — the `Item` contract: `Signal`, per-family stimulus/answer types, `GenerateOpts`; documents Attention's intentional absence
- `shared.ts` — `makeBase` + coordinate geometry (rotate/reflect/recenter/`samePointSet`)
- `gf.ts` — Logic: matrix reasoning + numeric series (rules stored for re-derivation)
- `gv.ts` — Spatial: mental rotation + odd-one-out (chiral polygon geometry)
- `gsm.ts` — Memory: Corsi span over a fixed 6-tile board (caller passes length/direction)
- `gs.ts` — Processing speed: symbol-search grid + target-cell answer key
- `ef.ts` — Planning: Tower of London with BFS-verified `minMoves` + optimal path
- `glr.ts` — Learning: paired-associate study set + recall round
- `ct.ts` — STEM: sequence / debug / loop / condition / maze (all symbol-based, zero text)
- `guards.ts` — type guards (`isGfMatrix`, `isCt`, …) for narrowing `Item`
- `registry.ts` — signal→generator map, `generateItem(...)`, `generatePractice(...)`
- `index.ts` — public barrel (entry points + types + guards + version)
- `__tests__/{prng,determinism,coverage,answer-key,distractors,purity}.test.ts` — Vitest suite (41 tests)

**Seed norms — versioned config (`src/content/norms/`) (Phase 1.05) — pure data:**
- `seed-norms.ts` — the single 1.05 tuning surface: start levels, span expectations, item caps, idle/validity/confidence thresholds, composite weights, raw→index formula constants, `SCORING_VERSION`/`NORMS_VERSION`; every value labeled seed
- `index.ts` — barrel

**Adaptive engine (`src/features/assessment/`) (Phase 1.05) — pure, deterministic state machine:**
- `types.ts` — engine shapes: `RawResponse`, `GradedItem`, per-domain state (laddered/span/fixed), `SessionState`, `NextAction`
- `engine.ts` — `startSession`/`nextAction`/`applyResponse`/`advanceDomain`/`runSession`; start-by-age, basal/ceiling, span +1/−1 + backward-from-8, fixed age-sized domains, `deriveSeed` per item
- `fixtures.ts` — reusable scripted-session profiles (logic-strong / spatial-strong / flat / ceiling / strong-invalid) + `correctResponse`/`wrongResponse`/`scoreProfile` (also for 1.07)
- `index.ts` — public barrel
- `__tests__/{engine,determinism}.test.ts` — adaptive path, start levels, Gsm growth/ceiling/backward, determinism

**Scoring layer (`src/features/scoring/`) (Phase 1.05) — raw → indices → bands/confidence/validity:**
- `types.ts` — `AssessmentResult` + parts; `Band`/`Confidence` imported as TYPES from the 1.03 components so it feeds the UI kit with no adapter
- `grade.ts` — grade a response against the item's verified answer key (correctness derived, never time-fed)
- `time.ts` — time-rules math: `effectiveTime` (idle-gap exclusion), mean/stdDev/coefficient-of-variation
- `raw.ts` — raw scores per signal (Дел 6.1) + extremes (ceiling/floor) helpers
- `indices.ts` — raw→0–100 families (accuracy/span/speed), composites (Дел 6.3), bands (Дел 6.4)
- `attention.ts` — derived attention (time variability + impulsive errors; no administered items)
- `validity.ts` — validity flags + graduated verdict ok/mild/strong (Дел 7.1)
- `confidence.ts` — per-index confidence high/medium/low (Дел 6.5)
- `finalize.ts` — folds a completed session into the `AssessmentResult`
- `index.ts` — public barrel
- `__tests__/{scoring-formulas,confidence-validity-extremes,attention-time,profiles-ui,purity}.test.ts` + `helpers.ts` — Vitest suite

**Timing layer (`src/features/timing/`) (Phase 1.06) — pure stopwatch + one React hook:**
- `constants.ts` — UI idle/timing constants (`IDLE_NUDGE_MS`=22 s, `IDLE_POLL_MS`); re-exports `IDLE_GAP_EXCLUDE_MS`/`TOO_FAST_MS` from norms
- `types.ts` — `CapturedTiming` (= engine `ResponseTiming`), `ItemTimerState`, `DeviceCalibration`
- `stopwatch.ts` — pure silent stopwatch + idle/tab-blur gap recording over injected timestamps (node-tested)
- `calibration.ts` — pure device-baseline summary (median inter-tap, or first-tap latency)
- `use-item-timer.ts` — React hook: the app's only clock (`performance.now`); idle watcher + visibility listener; `finish()` → `{ timing, calibration }`
- `index.ts` — barrel
- `__tests__/timing.test.ts` — stopwatch idle/finish, calibration, captured-timing↔scoring contract

**Task renderers (`src/features/assessment/tasks/`) (Phase 1.06) — thin `.tsx` over a pure `.ts` core:**
- `view.ts` — pure presenters + response builders (`buildGvView`, `correctFields`/`wrongFields`, `withTiming`, `instructionKey`); node-tested
- `glyphs.tsx` — shared SVG glyphs: shapes (Gf), abstract symbols (Gs/Glr), move arrows + condition tokens (CT)
- `gf-task.tsx` · `gv-task.tsx` · `gsm-task.tsx` · `gs-task.tsx` · `ef-task.tsx` · `glr-task.tsx` · `ct-task.tsx` — one renderer per signal
- `task-renderer.tsx` — dispatch by signal (same guards as the scorer)
- `task-screen.tsx` — shared chrome (progress + section + dots), silent stopwatch wiring, idle nudge, practice/real routing
- `index.ts` — barrel
- `__tests__/responses.test.ts` — response→answer-key mapping per signal, slow≠wrong, Gv render determinism

**Flow controller (`src/features/assessment/`) (Phase 1.06):**
- `flow.ts` — pure running-phase logic on the 1.05 engine: `settle` past domainComplete, `nextStep` (practice/real), 5 index-group progress
- `__tests__/flow.test.ts` — flow over the 5 fixture profiles (reproduces the engine path), determinism, one practice per task type

**Report engine (`src/features/report/`) (Phase 1.07) — pure, deterministic; reads 1.05 read-only:**
- `types.ts` — the engine contract: `DerivedFeatures`, the `ReportModule` schema (Дел 9.2), `ReportModel` (single render contract for 1.08 + 1.09), `ReportSummary`, `REPORT_ENGINE_VERSION`
- `features.ts` — layer 2 (Дел 9.1): `deriveFeatures` — profile shape, top-strength/growth, behaviour-only solving style, memory asymmetry, learning slope, extremes, STEM lead, positioning tier (report-local narrative seeds)
- `text.ts` — pure `{child}` → „вашето дете" resolver (+ sentence-initial „Вашето дете") and `resolveText`/`resolveTexts`
- `program.ts` — Дел 11 / Прилог E age + strength → IQ UP! program key (shared by positioning triggers + the assembler)
- `assemble.ts` — layer 3 (Дел 9.3): `assembleReport` — slot selection with total-order tie-break (priority → index order → id), validity branch (strong → retry variant)
- `select.ts` — `selectReportSummary` — the Дел 10.1 on-screen subset (pentagon + 5 bands + top strength + CTA)
- `index.ts` — public barrel
- `__tests__/{determinism,purity,profiles,validity-extremes,coverage,voice,text}.test.ts` — Vitest suite (36 tests)

**Report module library — versioned MK content (`src/content/modules/`) (Phase 1.07) — pure data:**
- `version.ts` — `MODULE_LIBRARY_VERSION` ("1.0.0"); stored in `ReportModel.meta`
- `ranges.ts` — indicative range caption per band (Дел 10.2 — never a number)
- `strengths.ts` — strength modules (per index × band) + fallback
- `growth.ts` — growth modules (no-attack frame) + „all strong" variant + fallback
- `styles.ts` — solving-style modules (slow+accurate / fast+accurate / fast+errors / balanced)
- `stem.ts` — STEM readiness (by band) + STEM bridge (spatial/logic/CT-led, broader than coding)
- `activities.ts` — per-index home activities (every index, not just the growth zone)
- `positioning.ts` — IQ UP! positioning (5 programs + fallback; program name shown, age→program logic internal as `programHook`)
- `cta.ts` — dynamic demo-class CTA copy (by growth zone) + fallback
- `extremes.ts` — ceiling (positive) + floor (gentle) copy
- `validity.ts` — mild soft-note + strong graceful-retry copy
- `index.ts` — barrel: `MODULE_LIBRARY` (flat) + per-category arrays + `modulesOf(category)`

**Scripts:**
- `scripts/dump-tasks.ts` — dev-only: print sample items per signal/level as JSON (`npx tsx scripts/dump-tasks.ts`)

**Public assets:**
- `public/fonts/.gitkeep` — Montserrat added in 1.02/1.03
- `public/images/.gitkeep` — brand/photos added later

**Project state (`src/_project-state/`):**
- `current-state.md` — live "where are we" snapshot
- `file-map.md` — this file
- `00_stack-and-config.md` — append-only stack + config log
- `completions/_TEMPLATE.md` — completion-report template
- `completions/Part-1-Phase-01-Completion.md` — Phase 1.01 (scaffold) report
- `completions/Part-1-Phase-02-Completion.md` — Phase 1.02 (design system) report (relocated from repo root, D-042)
- `completions/Part-1-Phase-03-Completion.md` — Phase 1.03 (base UI kit) report
- `completions/Part-1-Phase-04-Completion.md` — Phase 1.04 (task bank + generators) report
- `completions/Part-1-Phase-05-Completion.md` — Phase 1.05 (adaptive engine + scoring + norms) report
