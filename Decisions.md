# IqUp-V2 — Decisions

> **Append-only log of project decisions.** Seeded by Claude Chat during intake and planning. Claude Code adds a new entry every time it makes a decision on the fly during a phase. **Never edit or delete an existing entry** — if a decision is reversed, add a *new* entry that links back to the old one (see conventions at the bottom).
>
> The product source of truth is `IQ_UP_Specifikacija_v1_2_FINAL.pdf`. The entries here are the **build decisions** layered on top of it.

---

## Decisions

**D-001 · Project / repo name = `IqUp-V2`** — under GitHub owner `DinovLazar`, **public**. Local folder `/Users/lazar/Projects/IqUp-V2` (macOS). *Why: Lazar's choice.*

**D-002 · Lazar is the contractor; IQ UP! is the client.** Accounts, brand assets, the booking page, contact details, and the legal review are all client-provided. *Why: ownership model — Lazar builds; the client supplies and approves.*

**D-003 · App home = `iq.iqup.mk`.** This replaces the spec's example subdomain `procena.iqup.mk`. *Why: Lazar's preferred subdomain.*

**D-004 · Hosting = Vercel; upgrade Hobby → Pro before launch.** *Why: the free Hobby tier has an unclear commercial-use status and this is a paying client project. Pro ≈ $20/mo. Upgrade happens in Phase 3.05.*

**D-005 · DNS / CDN = Cloudflare, DNS-only record to Vercel (not proxied).** *Why: a proxied (orange-cloud) record in front of Vercel can cause conflicts; DNS-only avoids them.*

**D-006 · Public repo → no secrets in code, ever.** All API keys live only in Vercel's environment settings, server-side. *Why: the repo is public, and the spec mandates no keys on the client + no PII in logs.*

**D-007 · All paths are macOS-style** (`/Users/lazar/Projects/IqUp-V2`). *Why: Lazar works on a Mac; the master prompt's Windows path examples don't apply.*

**D-008 · No owner notifications on new leads.** Leads are visible in Brevo and the admin panel only. *Why: Lazar's choice — no Telegram/Slack/email ping needed.*

**D-009 · Quality bar = Lighthouse 95+ (mobile + desktop), WCAG 2.2 AA, first load < 2.5s on 4G, passes iOS Safari + Android Chrome.** *Why: confirmed defaults; the spec already requires WCAG AA and a fast load.*

**D-010 · Three-part build** — Part 1 local build → Part 2 integrations + Vercel preview → Part 3 polish + production cutover. Ships the **Macedonian MVP**. *Why: large custom app; the spec's later product phases (SR/HR/EN, verbal index, causal-reasoning domain) are out of scope for this build.*

**D-011 · Framework = Next.js (App Router) + TypeScript.** *Why: React-based to match the spec's SPA idea; runs natively on Vercel; its backend routes give us the light backend in one project; TypeScript guards the scoring engine.*

**D-012 · Front-end stack** — Tailwind CSS (styling), shadcn/ui on Radix (components, fully restyled), Motion / Framer Motion (animation), Lucide (UI icons), **custom SVG** for the pentagon and all test visuals. *Why: full brand control + accessibility + a light bundle; no charting dependency so the app and PDF render identically.*

**D-013 · Lead form = React Hook Form + Zod.** *Why: reliable validation including the required consents; the same Zod rules are reused server-side.*

**D-014 · Internationalization = next-intl; Macedonian at launch; no RTL.** *Why: clean per-language message files; visual tasks are language-neutral, only instructions/UI/CT-text localize; SR/HR/EN add later as more files.*

**D-015 · PDF report = @react-pdf/renderer, generated server-side.** *Why: lets us build the branded report (pentagon, bands, colors) as components that render identically on Vercel's serverless backend.*

**D-016 · Database = Supabase (Postgres, EU region) for the anonymous-scores store; Supabase Auth (with 2FA) for the admin login.** *Why: EU hosting for GDPR; simple to write to from Vercel; already connected; one vendor for DB + auth. Alternative considered: Vercel Postgres + Auth.js — not chosen, to keep one EU vendor.*

**D-017 · Email + CRM = Brevo (EU).** Stores leads, sends the transactional PDF email, runs email/SMS-by-city campaigns. *Why: spec-mandated; EU/GDPR-friendly.*

**D-018 · Analytics = GA4 + Meta Pixel + Conversions API (server-side, deduped via `event_id`).** *Why: spec-mandated funnel events; the server-side Meta Lead is reliable and ad-blocker-resistant.*

**D-019 · No AI at run-time.** The report's personalization is a deterministic module-assembly engine, not an LLM. *Why: hard spec rule — central to the product's credibility and legal posture.*

**D-020 · Booking is external / out of scope.** The CTA links to the client's existing booking page with the city attached: `{{BOOKING_URL}}?grad={city}`. *Why: the booking page already exists and isn't part of this build.*

**D-021 · Legal pages = hand-built + lawyer-reviewed** (not iubenda). *Why: the spec already provides the consent copy and a lawyer sign-off is required regardless; hand-built keeps cost and full control. iubenda was the paid turnkey alternative.*

**D-022 · Microsoft Clarity skipped for the MVP.** *Why: keeps the cookie-consent surface minimal under GDPR; can be added later if wanted.*

**D-023 · Dark mode out of scope for the MVP.** *Why: not needed for a fixed-palette children's assessment; revisit only if requested.*

**D-024 · Repo & branching follow the house bootstrap conventions, applied at Phase 1.01** — single branch `main` (= production), Vercel auto-previews every other branch / PR, branch protection on `main`, AI code review via CodeRabbit (auto on every PR) + Codex (assigned on architectural PRs), set up with the `gh` CLI. *Why: blends the house repo-bootstrap skill with Vercel's built-in preview model; no separate `development` branch needed.*

**D-025 · Project doc & state system follows the master prompt** (`docs/design-handovers/` + `src/_project-state/` with `current-state.md`, `file-map.md`, `00_stack-and-config.md`, and `completions/`) rather than the Kolekt `briefs/` / `reports/` / `status/` layout. *Why: the master prompt is the project-specific instruction; running one state system avoids two competing ones.*

**D-026 · Owner = `DinovLazar` (overrides the bootstrap skill's example owners).** The repo-bootstrap house skill lists example owners `Goran-Din` / `vertexmk-systems` / `north37-llc`; Lazar specified `DinovLazar`. *Why: Lazar's explicit instruction wins over the skill's examples.*

---

### Phase 1.01 — on-the-fly decisions (Claude Code, 2026-06-21)

**D-027 · Kept the existing on-disk `CLAUDE.md` / `AGENTS.md` / `Decisions.md`; did NOT overwrite them with the phase prompt's Appendix drafts.** The Phase 1.01 prompt told Code to place these three files "using the exact content in the Appendices." On disk, Chat had already placed richer, more current versions — the live `Decisions.md` holds D-001…D-026, whereas the Appendix draft only went to D-010; the live `CLAUDE.md`/`AGENTS.md` are fuller. *Why: the project's prime directive is "where a doc and the live code disagree, the live code wins — surface the mismatch." Overwriting would have destroyed 16 logged decisions and downgraded the rule files. **Surfaced for Chat/Lazar to ratify** — if the Appendix text was actually intended to supersede, say so and I'll reconcile.*

**D-028 · Package manager = npm.** pnpm/yarn are not installed on the machine; the phase says "pnpm if available, otherwise npm." Lockfile `package-lock.json` committed. *Why: use what's present; one lockfile, reproducible installs.*

**D-029 · Adopted current stable majors: Next 16, React 19, Tailwind v4 — which changes the plan tree.** Tailwind v4 is CSS-first, so there is **no `tailwind.config.ts`** (theme tokens live in `globals.css` `@theme`, brand theme done in 1.03), and config is **`next.config.ts`** (TS) not `next.config.js`. *Why: the phase says "use the latest stable… do not guess versions"; v4's CSS-first model supersedes the plan.md §7 filenames. Recorded in `00_stack-and-config.md`.*

**D-030 · next-intl set up "without i18n routing" (single MVP locale).** `src/i18n/request.ts` returns `locale: "mk"` + `messages/mk.json`; root layout consumes it and sets `<html lang="mk">`. A `[locale]` segment + middleware is the documented next step for SR/HR/EN. *Why: simplest correct pattern for an MK-at-root MVP that stays locale-ready; no RTL.*

**D-031 · Animation library installed as `motion` (v12), not the legacy `framer-motion` package.** Same library, current name; import from `motion/react`. *Why: `motion` is the maintained successor; the stack doc says "Motion (Framer Motion)".*

**D-032 · shadcn/ui initialised with the `radix` component library + `Nova` preset, neutral base color, Lucide icons.** Only `Button` was added (pipeline check). The `shadcn` npm package is a runtime dependency because `globals.css` imports `shadcn/tailwind.css`. *Why: spec is shadcn-on-Radix; neutral placeholder is fine until the 1.03 brand restyle.*

**D-033 · Renamed the completion-report template `Part-X-Phase-YY-Completion.md` → `_TEMPLATE.md`.** *Why: the phase step F asks for `_TEMPLATE.md`; a literal-placeholder filename in `completions/` reads like a malformed report. Per-phase reports keep the `Part-X-Phase-YY-Completion.md` name.*

**D-034 · Public pages sit under a `(site)` route group; placeholder landing at `src/app/(site)/page.tsx`.** Next.js boilerplate removed (root `page.tsx`, demo SVGs, Geist fonts, the create-next-app dark-mode CSS block). The placeholder uses a system font stack (covers Cyrillic) pending Montserrat in 1.03. *Why: matches plan.md §7's `(site)` group; keeps the scaffold clean for reviewers.*

**D-035 · Branch protection on `main`: PR required + no direct pushes + `enforce_admins`, but `required_approving_review_count = 0`.** The bootstrap skill flags that requiring 1 approval bricks a solo operator (can't approve your own PR). The phase requires only "a PR before merging; no direct pushes" — which 0 approvals satisfies. *Why: keeps the solo PR→merge workflow usable while still enforcing no-direct-push; CodeRabbit (not a human gate) provides the review. **Surfaced** — raise the count later if a second reviewer joins.*

### Phase 1.02 — Design decisions (made by Design; logged by Code in 1.03)

> Design could not commit to the repo, so these five accepted on-the-fly decisions from the 1.02 completion report are recorded here now that Code can. All five are **implemented in 1.03**.

**D-036 · Accessible `*-ink` index-text tokens** (`--color-mag-ink` etc.). The raw index hues fail 4.5:1 as text, but band labels need colored text; the darkened variants keep the index→color association while passing AA. *Why: WCAG 2.2 AA + the "never color-only" rule.*

**D-037 · A single `--shadow-pop` elevation token, scoped to modal/popover only.** *Why: honors the "no shadow-on-everything" rule while still giving floating UI one intentional lift.*

**D-038 · Puzzle-brain built as a clipped silhouette with 5 region paths** (not free-floating tiles). *Why: reads unmistakably as a brain even at the ~40px chip size and stays legible in the reduced-motion snap state.*

**D-039 · Band word-labels decoupled from the numeric §6.4 bands.** Parents see Во развој / Солидно / Силно / Исклучително + an indicative range only; the numbers stay internal to scoring. *Why: enforces the "no hard number" rule at the component level.*

**D-040 · Photo placeholders rendered as clearly-marked dashed blocks** ("PLACEHOLDER · Cowork asset"). *Why: zero ambiguity about where the real class photo drops in.*

### Phase 1.03 — on-the-fly decisions (Claude Code, 2026-06-22)

**D-041 · Branched `phase-1.03-ui-kit` off `phase-1.01-scaffold`, not bare `main`.** The 1.01 PR is **not yet merged** — `main` is still at the kickoff baseline (`8402953`) and lacks the entire scaffold. Branching off `main` as the brief literally says would have dropped 1.01. *Why: live-code-wins / don't lose work. **Surfaced** — when 1.01 merges, this PR should be merged/rebased after it so history is clean.*

**D-042 · Relocated the 1.02 handover + completion from the repo root into their proper homes** (`docs/design-handovers/Part-1-Phase-02-Handover.md`, `src/_project-state/completions/Part-1-Phase-02-Completion.md`). They were dropped at root (untracked) because Design can't commit. *Why: closes the loop the brief asked for, matches the brief's read-order paths and the 1.02 report's own "Files written" claims.*

**D-043 · `globals.css` rewritten brand-first.** Brand tokens **and** the shadcn/Radix semantic tokens (`--color-primary`, `--color-background`, …) now live in one `@theme` block, mapped to brand values, so future `shadcn add` components are on-brand with no second token system. Removed dark mode (the `.dark` block + `@custom-variant dark`), the unused neutral oklch palette, and the unused `chart-*`/`sidebar-*` tokens. *Why: implements no-dark-mode (D-023) and reconciles the inert `.dark` block flagged in `current-state.md`; one clean token layer.*

**D-044 · Kit gallery lives at `src/app/kit/`, not `src/app/_kit/`.** In the Next.js App Router an underscore-prefixed folder is a **private folder excluded from routing**, so `/_kit` (the brief's example) never resolves. Renamed to `kit`; gated to dev/preview only (404 when `VERCEL_ENV === "production"`) and marked `noindex`. *Why: the route must actually render for QA (DoD) — framework reality over the example path; live code wins.*

**D-045 · The puzzle-brain SVG is an original interpretation of handover §2.** The 1.02 mockup (`IQ UP Phase 1-02 Design System.dc.html`) was delivered as a streaming component and is **not in the repo**, so no exact path data existed. The silhouette + 5 region paths are structured so the mockup's exact geometry can be swapped in later without changing the component API. *Why: §2 specifies the structure (clipped silhouette + 5 regions), which is faithfully implemented; only the precise path curves are original.*

**D-046 · Confidence "висока" uses the brand teal-ink** (`#007D75`); средна = orange-ink, ниска = muted grey. *Why: the handover says "green," but the fixed brand palette has no separate green — teal is the brand's positive hue, and all three pass AA as text. Meaning is also carried by the bar count + word, never color alone.*

**D-047 · Built `IndexBandBar` (handover §4.2) as a reusable composition part** alongside the required band-label/confidence; **deferred** the other §4.2 components (reward badge, answer option, idle nudge) to their consuming screen phases (1.06/1.07). *Why: the brief's in-scope list and DoD name only the core kit + band-label + confidence; the band bar is a pure report-bound part worth having now, but the screen-specific extras are best built with their screens.*

### Phase 1.04 — on-the-fly decisions (Claude Code, 2026-06-22)

**D-048 · Test runner = Vitest, pinned `4.1.9` (exact).** The brief allowed adding Vitest if no runner existed; none did. *Why: TS-native, near-zero config, fast; reuses the `@/` alias via a 12-line `vitest.config.ts`. **Downside:** Vitest pulls Vite + esbuild/swc into devDeps (install-script warnings noted), and test files are inside `tsconfig` `include`, so `tsc`/`next build` also type-check them — kept clean rather than excluded so the build catches test rot.*

**D-049 · CT "Debug" uses an objective "first illegal move" answer key, not "differs from the intended solution."** The bug = the first arrow that drives the robot off the grid; everything before it is legal. *Why: "which step differs from the optimal path" is ambiguous (multiple optimal paths exist); "first off-grid step" is unique, provable, and child-legible ("tap the arrow that hits the wall"). The intended legal continuation still defines the displayed `goal`.*

**D-050 · Gv distractors are all reflections or different shapes — never a same-shape rotation at a "wrong angle."** Spec A.2 lists "wrong angle" as a distractor, but for the task "find the rotation of the prompt," ANY rotation is correct, so a wrong-angle same-shape option would be a second valid answer. *Why: guarantees a unique key. Realised the "wrong angle" idea as a mirror at a different angle; chirality of the base (verified at generation) ensures no reflection ever coincides with a rotation.*

**D-051 · `count` is the only numeric matrix attribute and its rules are range-bounded (base ≤ 2, single-axis step 1); shape/colour/rotation are cyclic.** *Why: an additive `count` progression could exceed the 1–6 render range and get clamped mid-pattern, silently breaking the rule (and the answer key). Bounding it keeps every cell in range with no clamp; categorical attrs wrap cleanly so they need no bound.*

**D-052 · Gsm bridges the uniform `(level, seed)` registry and the spec's `(length, direction)` interface via a level→length default table, with `opts.length`/`opts.direction` overrides.** *Why: the brief says the caller passes length+direction (adaptive logic is 1.05), but `generateItem` must also produce a valid item for "every level 1–10"; the table gives a sensible default while leaving the real control to 1.06/1.05.*

**D-053 · CT generators emit ZERO text (not even i18n keys).** All five sub-types are pure symbol/grid data; instructions are entirely the renderer's job (1.06) via next-intl. *Why: satisfies language-neutrality maximally — a purity test asserts no emitted string contains Cyrillic or whitespace — and avoids guessing key names before the screens exist. If a future item genuinely needs in-data text, it must be an i18n key, never a literal (spec Дел 17).*

### Phase 1.05 — on-the-fly decisions (Claude Code, 2026-06-22)

> All numeric values below are **seed / initial reference values** (spec Дел 6.6) carried in the result as `normsStage: "seed"` and centralised in `src/content/norms/seed-norms.ts` for recalibration from pilot + anonymous data. `SCORING_VERSION` / `NORMS_VERSION` start at `1.0.0`.

**D-054 · The Gf start-level-by-age table is reused as the shared start default for ALL laddered domains (Gv, EF, CT), not just Gf.** *Why: the spec only tabulates Gf; one curve is a defensible MVP seed. Flagged in code as a seed assumption — per-domain start curves should split out once pilot data shows the domains diverge.*

**D-055 · The half-step expected-forward-span bands (Прилог B.1, e.g. 6→"4–5") are resolved DOWN to the lower integer.** *Why: the brief asked to pick one value and note it; the lower end keeps the seed expectation safely attainable so pre-calibration results don't systematically read as "below typical" (which would be discouraging and unfair). Recalibrate from data.*

**D-056 · Item caps per laddered domain by age cluster (young 5–6 / mid 7–9 / older 10–13); lone-signal domains (Gf, Gv) capped one higher than shared-index domains (EF, CT).** Caps: lone {5,6,6}, shared {4,5,5}. *Why: realises the Дел 5 battery-length rule (target 4–6) and Дел 3.2's stability boost for indices that rest on a single signal.*

**D-057 · Gs grid level and Glr difficulty level are picked by age from the existing 1.04 level tables (cells 18→28, pairs 4→8); Glr recall rounds = 2 under age 9, 3 from age 9.** *Why: Gs/Glr are fixed (not laddered), so age selects one row; reusing the 1.04 tables avoids a parallel difficulty system. Round count seeds the 2–3 spec range.*

**D-058 · Domain administration order = gf, gsm, gv, gs, ef, glr, ct.** *Why: the spec leaves order open; this interleaves heavy reasoning (Gf) with lighter memory/spatial/speed beats so fatigue isn't front-loaded. Tunable; deterministic regardless.*

**D-059 · Idle-gap exclusion threshold = 30 s.** A gap longer than this is excluded from a task's effective time and counts toward the idle-pause flag. *Why: the spec excludes a pause only if inactivity "continues past" the ~20–25 s gentle-nudge window (Дел 8 rule 3), so the formal-exclusion threshold sits above the nudge.*

**D-060 · EF, Glr and Attention are mapped to the accuracy index family.** EF feeds its planning-efficiency ratio (mean `minMoves/moves` over solved items, 0–1), Glr its mean recall accuracy (0–1), Attention its 0–1 score. *Why: the spec gives these as 0–1-shaped scores without their own norm family; the accuracy family (`20 + x·75`) is the natural fit. Marked seed.*

**D-061 · Gs `expected` throughput is seeded as net (correct − 0.5·errors) per MINUTE, by age (8→20).** *Why: the spec defines the Gs raw score `(correct − 0.5·errors)/time` but tabulates no expected rate; per-minute units keep the spec's ×6 speed multiplier in a sensible range. Whole table is a seed to recalibrate.*

**D-062 · Confidence thresholds (Дел 6.5): laddered/Corsi evidence high ≥4 items, medium 3, low ≤2; Glr high ≥3 rounds, medium 2; a composite is only as confident as its weakest contributing signal; random-level accuracy forces that signal low; a strong session verdict forces every index low.** *Why: seeds the "items + consistency + validity" rule; the min-over-contributors rule keeps a composite honest when one input is thin.*

**D-063 · Validity thresholds (Дел 7.1): too-fast = RT < 500 ms, >30% of answers too-fast → STRONG; >60% same option position → flag; >3 excluded idle gaps → flag; Gs taps ≥90% of cells → Gs flag; a multiple-choice domain (≥3 items) within ±0.10 of chance (0.25) → random-level flag.** Verdict: any strong flag → `strong`; else any flag → `mild`; else `ok`. Same-position/idle/mashing/random are `mild`; too-fast is `strong`. *Why: seeds the spec's adjustable thresholds; only too-fast is severe enough alone to void the profile.*

**D-064 · Gsm span fed to the index = forward span below age 8; from age 8, `(forward + (backward + 2)) / 2`.** *Why: normalises backward (expected ≈ forward − 2) onto the forward scale so a backward span at its own expectation is score-neutral, while a strong/weak backward moves the index. Seed; recalibrate.*

**D-065 · EF ladders on goal-reached (solved), not on optimal solve; move-optimality feeds the raw efficiency score, not the ladder.** *Why: laddering on optimality would punish a correct-but-longer solution and stall the staircase; "did they reach the goal?" is the right basal/ceiling signal, and planning quality still differentiates via the efficiency raw score.*

**D-066 · Extremes (Дел 7.3): floor = a domain with items administered but zero correct; ceiling = all items correct AND the ladder topped out at level 10 (or Corsi reached the max span).** *Why: "cannot do the easiest" ⇒ no evidence of ability ⇒ floor (gently framed by 1.07); "solves everything at the top" ⇒ ceiling. Mutually exclusive by construction.*

**D-067 · Gsm per-direction trial backstop = 6.** *Why: the +1/−1 staircase with a 2-consecutive-error ceiling never terminates for a child sitting exactly at their span boundary (they oscillate pass/fail); the backstop caps a direction at 6 trials (worst case 6+6 from age 8).*

**D-068 · The result is keyed to the LIVE UI-kit identity, overriding the brief's pseudo-types: index keys are `logic|spatial|memory|planning|stem` (not `memoryFocus|planningSpeed|learningStem`) and the band enum is `development|solid|strong|exceptional` (not `in_development`).** *Why: the DoD requires the result to feed `lib/indices.ts` + the 1.03 components with no adapter; "live code wins" (CLAUDE.md). Using the brief's names would have forced a glue layer.*

**D-069 · Branched `phase-1.05-scoring` from `main`, not from `phase-1.04-task-bank` as the brief instructed.** *Why: reality diverged from the brief's note (and from D-041): `main` already contains the merged PRs #1–#3 (scaffold + UI kit + task bank) and the phase-1.0x branches no longer exist. Cutting from `main` is correct now; cutting from the named branch was impossible. Surfaced in the completion report.*

**D-070 · The timing layer lives in its own tree `src/features/timing/` (pure stopwatch/calibration `.ts` + one React hook), NOT under `src/features/assessment`.** *Why: the 1.05 purity test scans `src/features/assessment/**/*.ts` for any live clock / DOM / React. The renderers are `.tsx` (exempt), but the timing hook (`use-item-timer.ts`, the app's ONLY clock via `performance.now`) is `.ts` — keeping it under a separate, non-scanned tree lets the pure cores (`stopwatch.ts`, `calibration.ts`) stay node-tested while the hook stays browser-verified, with zero changes to the 1.05 purity scan.*

**D-071 · Device calibration is captured at the SESSION level, not inside the per-item `ResponseTiming`.** The 1.05 `ResponseTiming` is exactly `{ elapsedMs, idleGaps? }` with **no field for a calibration baseline**, so the captured baseline rides alongside in the flow as captured-but-inert state (like `parentAssistMode`), ready for the age/device-adjusted thresholds in 3.01. Baseline = median inter-tap interval, or first-tap latency for a single tap. *Why: the DoD explicitly asks to flag a timing-shape mismatch rather than silently change the 1.05 contract — this is that flag. The 1.05 layer is untouched.*

**D-072 · UI idle-timing constants live in `src/features/timing/constants.ts`, not in `seed-norms`.** Nudge threshold `IDLE_NUDGE_MS = 22 s` (inside the spec's 20–25 s window, below the 30 s `IDLE_GAP_EXCLUDE_MS`); a gap that reaches the nudge threshold is recorded in full and scoring excludes only > 30 s; the idle nudge is **suppressed during Gs** (the timed task). `IDLE_GAP_EXCLUDE_MS`/`TOO_FAST_MS` are re-exported from the norms so there is one source of truth. *Why: nudge cadence is a render concern; putting it in the 1.05 tuning surface would be an out-of-phase change to scoring config.*

**D-073 · Progress is mapped onto the 5 index-GROUPS, not the 7 domains.** Groups: logic=[gf], spatial=[gv], memory=[gsm], planning=[ef, gs], stem=[ct, glr] (attention is derived, not administered). The puzzle-brain `completed` = count of fully-finished groups; "Секција X од 5" = the active signal's group. Because administration order (gf, gsm, gv, gs, ef, glr, ct) differs from index order, the brain fills by COUNT (the handover's "N од 5" word-label semantics), not by which specific region. *Why: maps the 5-region brain to the 5 indices without forking the 1.03 `PuzzleBrain` (which takes a scalar `completed`).* 

**D-074 · Interaction-commit conventions per task family.** Choice tasks (Gf, Gv, CT sequence/loop/condition) = select-then-confirm ("Потврди"); CT debug = single tap on the broken step; Corsi = watch → tap back → "Потврди" (with "Одново"); Glr recall = auto-advance on pick; EF tower & CT maze = auto-submit on reaching the goal, with a "Доста, продолжи" give-up escape and "Одново" reset; Gs = auto-submit at the window end, or "Готово" early. The CT maze only allows advancing to fresh cells or undoing, so a goal-reaching path equals the generator's unique solution exactly. *Why: child-appropriate, deliberate where a misclick matters, fast where it doesn't, and structurally guarantees the maze path grades correctly.*

**D-075 · The setup form uses `noValidate` so the custom MK age validation governs.** *Why: native `min`/`max` HTML constraint validation silently BLOCKS form submission for out-of-range ages, so the friendly "Оваа проценка е наменета за деца од 5 до 13 години" message would never appear and the block would feel broken; `noValidate` hands range-checking to the app while `min`/`max` stay as spinner hints. No child name is collected.*

**D-076 · Original glyph system for the stimuli (no 1.02 mockup geometry to copy, mirrors D-045).** A 6-colour abstract palette for the Gf `colorIndex` + a white orientation pip so rotation is legible on otherwise-symmetric shapes; a 12-symbol outline set for Gs distractors/targets and Glr targets; Glr cues are filled shapes vs targets are outline symbols (two distinct families); Gv polygons are scaled by ONE shared factor so a pure rotation is not a size cue. All language-neutral, meaning never colour-only. *Why: the handover mocked one screen; the visual language was extended consistently to all 7 task types. Swappable for exact mockup geometry later without API changes.*

**D-077 · One practice example per signal (7 total), before each domain's first real item, skippable; the first (Gf) practice also captures calibration.** CT shows a single sub-type as its worked example even though the real CT items may show other sub-types. *Why: matches spec Дел 7.2 "one worked example precedes each new task type"; a per-sub-type CT practice would 5× the CT preamble for marginal benefit.*

**D-078 · No child name anywhere → a `{child}` token resolving to „вашето дете" (resolved-decision 2 made concrete).** The product collects no child name (spec Дел 13.1 / 14.3). Module copy uses a `{child}` token that a pure resolver (`src/features/report/text.ts`) expands to „вашето дете", capitalised to „Вашето дете" at a sentence start. Copy is authored to read naturally without a name (implied subject, „детето"); the token is kept rather than hard-coding the phrase so the library is future-proof if a display-only name is ever introduced — only the resolver would change. *Why: privacy is non-negotiable; the token keeps the option open without touching content.*

**D-079 · Report module text is MK-only this phase, multilingual-ready by schema.** `LocalizedText` keeps `sr` / `hr` / `en` slots but only `mk` is authored (resolved-decision 3); SR/HR/EN are a later product phase. *Why: matches the build's MK-MVP scope while making the later language phases a pure content add, no schema change.*

**D-080 · Task 1 — the report engine builds READ-ONLY against the per-item signals 1.05 already exposes; no widening of the 1.05 contract.** `AssessmentResult.SignalResult` already carries `perItem[]` (level, span/direction, correct, effectiveTimeMs, errorType, tooFast) plus the aggregate observables (`meanEffectiveTimeMs`, `timeVariability`, `impulsiveErrorRate`, `learningSlope`, `span`, `ceiling`, `floor`) — with the 1.05 comment „surfaced for transparency + 1.07 features." The derived-features layer reads these directly; option (a)/(b) from the brief was unnecessary. *Why: 1.05 had already exposed exactly what Дел 9.1 layer 1 needs; the cleanest contract is the one that exists.*

**D-081 · Report-engine narrative thresholds live in the report layer (`features.ts` `NARRATIVE`), NOT in `seed-norms`, and tune copy selection only — never a score.** The solving-style classifier (fast+accurate / slow+accurate / fast+errors / balanced) is grounded purely in observed behaviour (accuracy, impulsive-error rate, fast-but-correct rate over the reasoning items) per Дел 9.5; profile-shape / STEM-lead / memory-asymmetry thresholds likewise. The engine never recomputes indices/bands/confidence/validity (resolved-decision 5). *Why: putting narrative seeds in the 1.05 tuning surface would be an out-of-phase change to scoring config; classification is report-only and must stay separable from measurement.*

**D-082 · The voice lint is a strict case-insensitive substring check; copy is authored to avoid every banned substring, and the brand „IQ UP!" is allow-listed.** Banned: „слабост", „проблем", „заостанува", „невронаука", „извршни функции", „когнитивни домени", „IQ", „дијагноза". Because „проблем" is banned as a substring, even positive seed phrasings were reworded (Прилог C „отворени проблеми" → „задачи со повеќе можни решенија"; „решавање проблеми" → „решавање нови задачи"). „IQ UP!" is stripped before the „IQ" check so the brand name is allowed. The internal `programHook` is excluded (never parent-facing). *Why: a mechanical substring lint is the strongest enforcement of the §9 voice and the legal posture; authoring around it keeps the rule simple and total.*

**D-083 · `IndexPresentation` carries the numeric index `value` for PENTAGON GEOMETRY only — never rendered as text.** So `ReportModel` is self-sufficient: 1.08 (summary) and 1.09 (PDF) draw the pentagon shape from the model alone, while the parent still sees only band word + indicative range (Дел 10.2 — no hard number). *Why: the pentagon needs coordinates; making the model the single render contract (a DoD requirement) means the shape value must live on it, kept strictly out of any text surface.*

**D-084 · The lead form + confirmation are PHASES inside the `/procena` flow machine, not separate routes (Phase 1.08 resolved-decision 1).** Appended after `completion` via a pure `advanceEndPhase` controller in `flow.ts` (completion → form → confirmation); the React `Assessment` machine drives it, holding the validated values + scored result in browser memory. *Why: keeps the 1.06 pure-core / thin-React split and the single in-memory state machine; nothing is persisted before (or by) the form.*

**D-085 · The completion screen gets a primary „Земи го извештајот" button to the form; the form's submit advances to the confirmation; the `AssessmentResult` is finalized ONCE on leaving completion and the `ReportModel` is assembled ONCE (via `assembleReport`) on the confirmation (Phase 1.08 resolved-decision 2).** *Why: the child's reward badge stays as-is while the parent gets a clear affordance; assembly is deterministic, so assembling once and reusing avoids recompute and guarantees a stable view.*

**D-086 · The 8 lead fields + rules (Phase 1.08 resolved-decision 3 / spec Дел 13.1).** `parentFirstName` (required, trimmed, first name only — NO surname, NO child name), `email` (required, Zod email), `phone` (required, permissive: allowed glyphs + 6–15 digits, no MK normalization), `city` (required free-text, wrapped in a `CityField` swap-seam for the Part-2 centers `<select>`), `childGender` (optional enum `male|female|undisclosed`), `consentService`/`consentParent` (required true), `consentMarketing` (optional). *Why: matches the spec field set + privacy posture; permissive phone avoids rejecting valid international formats in the MVP.*

**D-087 · `submitLead(values, result)` is a single stubbed orchestrator seam; in Part 1 it does no network and resolves a typed success (Phase 1.08 resolved-decision 4).** Its documented Part-2 contract owns: create/update the Brevo lead → fire Meta `Lead` (CAPI, `event_id` dedup) + GA4 → generate + email the PDF (never stored) → and, SEPARATELY, write the anonymous score row (the two stores must never be joinable, Дел 14.1). *Why: build the seam + its contract + the call site now; fill the bodies in Part 2 without re-plumbing.*

**D-088 · The analytics seam is a typed no-op `trackEvent` at `src/lib/analytics.ts` (Phase 1.08 resolved-decision 5).** Fires exactly `form_view` (on form mount), `lead_submit` (`{ city }`, on a successful submit) and `cta_booking_click` (`{ city, source }`, on the booking CTA click); city only — no PII. GA4 + Meta (with `event_id` dedup) are wired in Phase 2.03. *Why: the reserved analytics home; the call sites are correct now so Part 2 only fills the body.*

**D-089 · Booking CTA = a non-secret `NEXT_PUBLIC_BOOKING_URL` placeholder + a pure `buildBookingHref(url, city)` returning `` `${url}?grad=${encodeURIComponent(city)}` `` (Phase 1.08 resolved-decision 6).** Default placeholder `https://booking.example.invalid` in `cta.ts`. *Why: the real URL is a pending Cowork asset; the pure builder + placeholder let the CTA ship and be tested now.*

**D-090 · The confirmation disclaimer uses the static canonical Прилог D.4 text as a placeholder (Phase 1.08 resolved-decision 7).** The shared reusable „informative, not diagnostic" component + its 7-placement audit are Phase 1.10; a clear seam is left, not built. *Why: consistent with how `/kit` + the landing footnote already show the static text.*

**D-091 · The „Извештајот е пратен на вашата e-mail адреса" line on the confirmation is PRODUCTION copy (Phase 1.08 resolved-decision 8 / spec §2.2), even though the send is stubbed in Part 1.** *Why: the copy is correct for the shipped product; only the send mechanism is deferred to Part 2 (1.09 builds the PDF).*

**D-092 · Branched `phase-1.08-lead-form` from `main`, not from `phase-1.07-report-engine` as the brief's primary instruction said.** PR #6 (the 1.07 branch) is already merged into `main` (commit `00beacf`), so the brief's own fallback applied — cut from updated `main`. Mirrors D-069. *Why: the named branch is already collapsed into `main`; cutting from `main` is the correct, current path.*

**D-093 · Required consents are modeled as `z.boolean().refine(v => v === true)`, not `z.literal(true)`.** Both reject `false`/absent IN THE SCHEMA (the DoD requirement); `refine` keeps the field's input type `boolean`, so an un-ticked checkbox (`false`) is a valid React Hook Form default while the schema still requires `true`. *Why: `z.literal(true)` would type the input as `true`, making a `false` default a type error — refine enforces the same rule with clean RHF ergonomics.*

**D-094 · The shared Zod schema emits stable error TOKENS (e.g. `emailInvalid`, `consentServiceRequired`), not prose; the form maps each token to MK copy via `messages/mk.json`.** *Why: keeps the schema framework-free and reusable verbatim by the Part-2 API route, and keeps every parent-facing string in the single i18n source (§9 voice).*

**D-095 · First DOM tests in the repo (Phase 1.08).** `vitest.config.ts` now includes `*.test.tsx`; the global environment stays `node` (the pure cores keep their fast Node suite) and the two React tests opt into `jsdom` per-file via a `// @vitest-environment jsdom` docblock. `@testing-library/react` + `jsdom` pinned exact; `fireEvent` is used over `user-event` to avoid Radix pointer-capture machinery in jsdom (a few guarded `Element.prototype` stubs cover the Radix primitives). *Why: `form_view`-on-mount and the inline-error a11y behavior need a real render; per-file opt-in keeps the 23 pure files Node-only.*

**D-096 · The form's submit logic is extracted as a pure, dependency-injected `runLeadSubmit(values, result, { submit, track, onSubmitted })` pipeline (persist → `lead_submit` → advance).** The component is a thin caller; the ordering + arguments are unit-tested in Node with spies. *Why: continues the 1.06 pure-core / thin-React split so the seam wiring is provable without a DOM, and the React test only has to confirm the integration.*

**D-097 · Bundle OFL Montserrat static TTFs in-repo for the PDF and register them with `@react-pdf` (Phase 1.09).** `src/features/report/pdf/fonts/Montserrat-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf` (weights 400/500/600/700/800; full Macedonian Cyrillic coverage verified with `fontkit`) + `OFL.txt`, sourced from the canonical JulietaUla/Montserrat distribution. This PDF font pipeline is **independent** of the web `next/font/google` pipeline. *Alternatives + downsides:* `next/font` ships woff2 (which `@react-pdf` cannot read) and the Montserrat variable font is unsupported by `@react-pdf` (needs static per-weight TTFs); fetching fonts at build/runtime would add a network dependency (and break the no-runtime-Google-call privacy rule). Downside: ~2.2 MB of binary TTFs committed to a public repo, and a manual swap if Cowork later ships a brand-tuned Montserrat (clean: drop-in replace the files). *Why: it is the only reliable way to render Macedonian Cyrillic in `@react-pdf`, and OFL permits committing.*

**D-098 · Preview the PDF via `renderToBuffer` + a dev dump script, not an in-browser viewer (Phase 1.09).** `renderReportPdf(model, { city })` uses `@react-pdf`'s `renderToBuffer`; `scripts/dump-report-pdf.ts` renders all five `fixtures.ts` profiles to a gitignored `./tmp/` for visual QA (rasterized with `pymupdf`). *Alternatives + downsides:* an in-`/kit` `@react-pdf` `PDFViewer` runs client-side (can't exercise the server render seam the 2.02 route needs, and pulls a heavy viewer into the app bundle); `renderToStream`/`renderToFile` don't fit the "return a buffer to email" 2.02 contract. Downside: QA is manual (generate + rasterize), not visible in the running app. *Why: matches the repo's `scripts/dump-tasks.ts` pattern and builds the exact server seam 2.02 imports unchanged.*

**D-099 · PDF chrome strings live in a new `reportPdf` namespace in `messages/mk.json`, imported STATICALLY into the pure builder (Phase 1.09).** `document.tsx` does `import mk from "…/messages/mk.json"` and reads `mk.reportPdf` + reuses `mk.legal.disclaimer`/`mk.legal.dataNote`. *Alternatives + downsides:* next-intl `getTranslations` is async and context-bound (would make the builder impure/async); inlining strings in the module would split parent-facing copy off the single i18n source. Downside: the whole `mk.json` is pulled into the builder's module graph (already bundled elsewhere; negligible). *Why: keeps `buildReportDocument` a pure, synchronous function while honouring the "all parent copy in one i18n source" rule (consistent with the assembler importing constant data).* See [[D-094]].

**D-100 · §D.4 disclaimer rendered at the TOP (first flow element) AND as a `fixed` footer on every page bottom; the §D.2 data note + the FULL Дел 10.3 report (incl. all-five per-index home activities, solving style) render from the `ReportModel` (Phase 1.09).** The on-screen confirmation (1.08) shows only the summary; the PDF is the full report. *Alternatives + downsides:* a single trailing disclaimer would not satisfy "top + bottom" (spec Дел 16.1); showing only the growth-zone activities would drop model data the engine already produces for all five indices. Downside: the fixed footer needs reserved `paddingBottom`, and very long profiles paginate (kept to 2 pages by tightened spacing). *Why: spec Дел 16.1 requires top + bottom, and 1.09's job is to render the full model the parent receives.*

**D-101 · Branched `phase-1.09-pdf-report` from `main`, per the brief's own fallback (Phase 1.09).** The brief said branch from `phase-1.08-lead-form`, or from `main` if PR #7 is already merged; PR #7 is merged, so `main` is the current chain tip. Mirrors [[D-092]]. *Why: the named branch is already collapsed into `main`; cutting from `main` is the correct, current path.*

**D-102 · The §16.1 disclaimer is wired in 5 hosts now and copy-ready for the 2 deferred hosts (Phase 1.10).** The shared `Disclaimer` component is live in placement #1 landing footnote (short), #2 pre-start (short), #3 results/confirmation (full, incl. the retry branch), #4 PDF (top = full / footer = short) and #6 About-the-test page (full). Placements #5 transactional e-mail (built with Brevo in Phase 2.02) and #7 cookie banner (Phase 3.03 legal finalization) have their canonical copy already in `messages/mk.json` (`legal.disclaimer` / `legal.disclaimerShort`) plus a documented one-import drop-in, but their hosts do not exist in Part 1, so they are NOT stubbed. *Alternative considered:* stub fake e-mail + cookie-banner hosts now just to hold the line on "all 7 wired." *Downside (honest):* the plan §14 "all 7 placements" criterion is only fully LIVE at 3.03 — this phase's audit marks 2 of 7 as "copy ready, wired at host phase." *Why: stubbing non-existent hosts is dead scaffolding that misrepresents what ships; with the copy in the single i18n source the 2.02/3.03 adoption is a one-line `<Disclaimer/>` (or key read), not a copy migration.*

**D-103 · Branched `phase-1.10-disclaimer-static-pages` from `main` (Phase 1.10).** The brief's Task 1 said cut from the tip `phase-1.09-pdf-report` because "PR #8 is not yet merged," but PR #8 IS merged (commit `ad51f18`), so `main` is the current chain tip and already contains 1.09. Mirrors [[D-101]] / [[D-092]]. *Why: the named branch is already collapsed into `main`; cutting from `main` is the correct, current path.*

**D-104 · The shared `Disclaimer` is an isomorphic next-intl component (no `"use client"`), and the new static pages are sync Server Components (Phase 1.10).** `Disclaimer` reads `useTranslations("legal")` and uses no client-only API, so the same module renders as a Server Component on the static/landing pages and inside the `"use client"` flow screens (confirmation / pre-start / `/kit`) alike — every placement from the one `legal` source. `/za-testot`, `/politika-za-privatnost`, `/uslovi` are sync Server Components using `useTranslations` for the body + async `generateMetadata` using `getTranslations` for the MK `<title>` + description (mirroring `procena/page.tsx`); a shared `(site)/page-shell.tsx` gives them consistent header/back chrome. *Alternatives + downsides:* marking `Disclaimer` `"use client"` would force it into the client bundle on otherwise-static pages for no gain; making the page bodies async + `getTranslations` would make them awkward to unit-test (no request scope in Vitest). *Why: next-intl v4's `useTranslations` is isomorphic, so one component serves both registers in both runtimes, and sync Server Components keep the pages testable under `NextIntlClientProvider`.* See [[D-099]].

**D-105 · The PDF footer now renders the SHORT line (top stays the FULL §D.4); the duplicate per-screen short keys are consolidated to one `legal.disclaimerShort`, guarded against drift (Phase 1.10 — refines [[D-100]]).** 1.09 rendered the full §D.4 at both top and footer; 1.10 sets the fixed footer to `legal.disclaimerShort` so the per-page footer is one line while the top keeps the full paragraph. The short line — previously duplicated as `landing.disclaimer` + `prestart.disclaimer` — is removed and replaced by the single `legal.disclaimerShort`. A `disclaimer-single-source` test asserts no production `.ts/.tsx` hardcodes the copy and each canonical string appears exactly once in `mk.json`; a `disclaimer-parity` test ties the PDF (via the component's exported `DISCLAIMER_KEYS`) to that same source. *Why: one source, two renderers (DOM + `@react-pdf`), a test between them — the same pattern as `pentagon.ts`/`pentagon.tsx` and the 1.09 theme sync-guard; a one-line footer also comfortably fits the fixed-footer clearance D-100 reserved.*

## Decision-log conventions

- **Append, don't edit.** Existing entries are never changed or removed.
- **Reversals get a new entry.** If a decision changes, add a new `D-NNN` entry that states the new decision and references the one it supersedes (e.g. "supersedes D-021"). The old entry stays in place.
- **Number sequentially** — `D-001`, `D-002`, … Don't reuse numbers.
- **One line of "why" per entry**, in plain language.
- **Who appends:** Chat seeds and adds decisions made in chat; Code adds decisions it had to make on its own during a phase (and surfaces them in its completion report so Chat can flag them to Lazar).
