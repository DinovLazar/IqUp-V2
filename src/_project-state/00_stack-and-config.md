# IqUp-V2 — Stack & Config Log

> Append-only log of stack and configuration decisions, with pinned versions. **Claude Code appends here** whenever a dependency is added/upgraded or a config decision is made. Newest entries at the bottom. Exact versions are pinned at Phase 1.01 when packages are first installed.
>
> Lives at `src/_project-state/00_stack-and-config.md`.

## Locked stack (seeded at kickoff — versions pinned at 1.01)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | pin at 1.01 | React-based; serverless API routes are the backend. |
| Language | TypeScript | pin at 1.01 | Strict mode. |
| Styling | Tailwind CSS | pin at 1.01 | Brand tokens as theme config. |
| Components | shadcn/ui (Radix) | copy-in | Restyled to brand; components vendored into the repo. |
| Animation | Motion (Framer Motion) | pin at 1.01 | LazyMotion for a light bundle. |
| Icons | Lucide (lucide-react) | pin at 1.01 | UI icons only; science visuals are custom SVG. |
| Forms | React Hook Form + Zod | pin at 1.01 | Validation incl. consents; reused server-side. |
| i18n | next-intl | pin at 1.01 | MK at launch; no RTL. |
| PDF | @react-pdf/renderer | pin at 1.01 | Server-side report rendering. |
| Database | Supabase JS (Postgres, EU region) | pin at 1.01 | Anonymous scores only; project created in 2.01. |
| Admin auth | Supabase Auth | — | 2FA, roles, access logging. |
| Email / CRM | Brevo (API) | — | Server-side transactional send; account in 2.02. |
| Tracking | GA4 + Meta Pixel/CAPI | — | Server-side Lead, deduped via `event_id`; off outside production. |
| Hosting | Vercel | — | Hobby → Pro before launch (3.05). |
| DNS / CDN | Cloudflare | — | DNS-only record to Vercel (3.05). |
| Node | Node LTS | pin at 1.01 | Match Vercel's supported runtime. |
| Package manager | npm / pnpm | pin at 1.01 | Code picks at scaffold and records the choice here. |

## Config decisions

- **Environments:** dev / preview / production. Analytics + Meta are disabled outside production (spec §19.4).
- **Secrets:** never committed (public repo); only in Vercel env vars, server-side.
- **Branching:** single `main`, PR-only, branch protection, CodeRabbit + Codex (see `CLAUDE.md`).

## Append log

*(Code adds dated entries below as the stack/config changes — newest at the bottom.)*

- **2026-06-21** — Stack locked during planning (see `Decisions.md` D-011…D-018, D-024). Exact versions to be pinned at Phase 1.01.

- **2026-06-21 · Phase 1.01 — scaffold installed; versions pinned.**

  **Toolchain (developer machine):**
  - Node `v26.3.0`, npm `11.16.0`. **Package manager = npm** (pnpm/yarn not installed on the machine). Lockfile: `package-lock.json`. *(Vercel will pin its own Node runtime in Part 2; not constrained via `engines` yet.)*

  **Runtime dependencies (pinned in `package.json`):**
  | Package | Version | Role |
  |---|---|---|
  | next | 16.2.9 | Framework (App Router, Turbopack build) |
  | react / react-dom | 19.2.4 | UI runtime |
  | next-intl | ^4.13.0 | i18n (MK at root) |
  | motion | ^12.40.0 | Animation (successor to `framer-motion`; import from `motion/react`) |
  | lucide-react | ^1.21.0 | UI icons (added via shadcn) |
  | radix-ui | ^1.6.0 | shadcn primitives |
  | class-variance-authority | ^0.7.1 | shadcn variants |
  | clsx | ^2.1.1 | className helper |
  | tailwind-merge | ^3.6.0 | className merge |
  | tw-animate-css | ^1.4.0 | shadcn animations (Tailwind v4) |
  | shadcn | ^4.11.0 | **load-bearing**: `globals.css` imports `shadcn/tailwind.css` |

  **Dev dependencies:** typescript ^5, tailwindcss ^4 (+ @tailwindcss/postcss ^4), eslint ^9 (+ eslint-config-next 16.2.9), prettier ^3.8.4, prettier-plugin-tailwindcss ^0.8.0, @types/node ^20, @types/react ^19, @types/react-dom ^19.

  **Deferred dependencies (NOT installed in 1.01 — added in the phase that uses them, per D-010):** React Hook Form + Zod → Phase 1.08; @react-pdf/renderer → Phase 1.09; Supabase / Brevo / Meta / GA4 clients → Part 2.

  **Config decisions / deviations from `plan.md` §7:**
  - **Tailwind is v4 (CSS-first).** There is **no `tailwind.config.ts`** — theme tokens live in `src/app/globals.css` under `@theme`. The brand theme is implemented there in Phase 1.03. (Plan tree listed `tailwind.config.ts`; superseded.)
  - **`next.config.ts`** (TypeScript) instead of `next.config.js`; wrapped with `createNextIntlPlugin("./src/i18n/request.ts")`.
  - **next-intl approach = "without i18n routing"** (single MVP locale). `src/i18n/request.ts` returns `locale: "mk"` + the `messages/mk.json` bundle; the root layout reads it via `getLocale()`/`getMessages()` and sets `<html lang>`. Locale-ready: add a `[locale]` segment + middleware later for SR/HR/EN. No RTL.
  - **shadcn/ui** initialised with the **radix** component library + **Nova** preset, **neutral** base color, **Lucide** icons, CSS variables on. `Button` added to confirm the pipeline. Real brand restyle = Phase 1.03. The shadcn `.dark` token block is present but **inert** (only applies under a `.dark` ancestor we never add) — reconciled with the no-dark-mode rule in 1.03.
  - **ESLint** = Next flat config (`eslint.config.mjs`). **Prettier** added with `prettier-plugin-tailwindcss`; Markdown is excluded from Prettier (`.prettierignore`) so hand-authored docs aren't reformatted.
  - **Fonts:** placeholder uses a system sans stack (covers Macedonian Cyrillic); Montserrat (Cyrillic + Latin) lands in 1.02/1.03. Geist boilerplate fonts removed.

  **Verification:** `npm run build` ✓, `npm run lint` ✓, `npm run typecheck` ✓, `npm run format:check` ✓; dev server serves `/` (HTTP 200) with `<html lang="mk">` and the MK strings rendered.

- **2026-06-22 · Phase 1.03 — base UI kit; brand theme + fonts.**

  **No new dependencies.** The whole kit is built on the already-pinned stack (Tailwind v4, shadcn/Radix `radix-ui`, Motion, Lucide). Montserrat ships via Next's built-in `next/font/google` (part of `next` 16.2.9) — no package added.

  **Config decisions / deviations:**
  - **`src/app/globals.css` rewritten brand-first (D-043).** All design tokens (handover §1 / spec App. G) live in a single `@theme` block; the shadcn/Radix semantic tokens (`--color-primary`, `--color-background`, …) are mapped to brand values in the same block (so future `shadcn add` components are on-brand). Removed: the scaffold's `.dark` block, `@custom-variant dark`, the neutral oklch palette, and the unused `chart-*`/`sidebar-*` tokens. Kept `@import "shadcn/tailwind.css"` (it provides Radix-state custom variants `data-checked`/`data-disabled`/… used by the form components).
  - **Type roles** are exposed as Tailwind v4 paired-token utilities `text-display|subhead|label|body` (each carries size + line-height + letter-spacing + weight). Standalone `--font-weight-*` tokens kept per the handover.
  - **Fonts:** Montserrat via `next/font/google`, subsets `["latin","cyrillic"]`, weights `400/500/600/700/800`, `display:"swap"`, exposed as `--font-montserrat` → fed into `--font-sans`. Self-hosted at build time (no runtime Google call → privacy/self-host rule). `public/fonts/` left clean for a future `next/font/local` swap if Cowork ships brand woff2s.
  - **Gradients** (`--grad-brand`, `--grad-wash`) are `:root` custom props + `@utility bg-grad-brand|bg-grad-wash` (they're images, not colors). `--shadow-pop` is the only shadow token (→ `shadow-pop`), reserved for popover/modal.
  - **Kit gallery route = `src/app/kit/` (D-044)** — not `_kit` (underscore folders are private/non-routing in the App Router). Dev/preview only (404 on `VERCEL_ENV==="production"`), `noindex`.
  - **`.claude/` gitignored** — local agent/editor tooling (preview `launch.json`), not project source.

  **Verification:** `npm run build` ✓ (routes `/`, `/_not-found`, `/kit`), `npm run lint` ✓ (0 problems), `npm run typecheck` ✓; dev server serves `/` and `/kit` (HTTP 200); `/kit` visually verified — Montserrat Cyrillic, palette hex, pentagon geometry, and the puzzle-brain assembly (incl. 40px chip) all render correctly.

- **2026-06-22 · Phase 1.04 — task bank + procedural generators; Vitest added.**

  **New dependency (pinned exact, D-048):**
  | Package | Version | Role |
  |---|---|---|
  | vitest | 4.1.9 | Test runner (devDependency); pinned exact (no caret). |

  Adds scripts `test` (`vitest run`) and `test:watch` (`vitest`). New `vitest.config.ts`: node environment, `@/` alias mirroring tsconfig, includes `src/**/*.test.ts`. *(Vitest pulls Vite + esbuild/swc + a few native deps with install scripts — npm prints `allow-scripts` warnings; harmless for local dev/CI.)*

  **Config decisions / deviations:**
  - **No `Math.random`, `Date`, or env reads** anywhere in `src/features/tasks`, `src/content/tasks`, or `src/lib/prng.ts` — enforced by a static-scan purity test. All randomness flows from `makeRng(seed)` (mulberry32 + FNV-1a) with deterministic sub-seeds via `deriveSeed`.
  - **Generators emit pure data / coordinate geometry only** — no React, no `.tsx`, no SVG/markup, no CSS (mirrors `pentagon.ts`). Rendering is 1.06; scoring/norms/adaptive logic are 1.05.
  - **`TASK_BANK_VERSION = "1.0.0"`** lives in `src/content/tasks/version.ts`, stored with each record (spec Дел 19.4).
  - **Attention has no generator** (spec signal #5 is derived in 1.05) — documented in `types.ts` + the completion report.
  - **Test files are inside the tsconfig `include`** (`**/*.ts`), so `tsc` and `next build` type-check them too; kept clean rather than excluded. See D-048…D-053.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (unchanged routes), `npm test` ✓ (6 files, 41 tests), `npm run format:check` ✓. EF `minMoves` hits the configured target 400/400 across levels 1–10 × 40 seeds.

- **2026-06-22 · Phase 1.05 — adaptive engine + scoring + seed norms.**

  **No new dependencies.** Pure TypeScript on top of the existing PRNG + task bank; tests on the already-pinned Vitest `4.1.9`. (The brief expected no new runtime deps; none were added.)

  **New modules:** `src/content/norms/` (seed config), `src/features/assessment/` (adaptive state machine + scripted fixtures), `src/features/scoring/` (grading → indices → bands/confidence/validity → `finalize`). 7 new Vitest files (101 tests total across the repo).

  **Config decisions / deviations:**
  - **`SCORING_VERSION` + `NORMS_VERSION` = `1.0.0`** live in `src/content/norms/seed-norms.ts`, carried in every `AssessmentResult.meta` alongside `taskBankVersion` and `normsStage: "seed"` — so results are honestly labeled as seed-norm reference values, not measured norms (spec Дел 6.6).
  - **One seed-norms tuning surface.** Every tunable (start levels, span expectations, item caps, composite weights, raw→index constants, time/validity/confidence thresholds) lives in one file, each labeled a seed to recalibrate. Decisions D-054…D-069.
  - **Purity enforced** by a static-scan test over `src/features/assessment`, `src/features/scoring`, `src/content/norms`: no `Math.random`/`Date`/`Date.now`/`performance.now`/`setTimeout`/`setInterval`/`requestAnimationFrame`/`window`/`process.env`, and no runtime React import. Timing enters only as passed-in data; **slow ≠ wrong** is structural (non-Gs scoring functions never receive time).
  - **Output keyed to the live UI kit** (D-068): `AssessmentResult.indices` uses the `lib/indices` `IndexKey`; `Band`/`Confidence` are imported *as types* from the 1.03 components, so enum drift breaks the build. Overrides the brief's `memoryFocus`/`in_development` pseudo-types ("live code wins").
  - **No automated AI review yet** (CodeRabbit/Codex pending) — substituted an internal multi-agent adversarial review pass; it found one real bug (Gsm floor/ceiling mutual-exclusivity), fixed + regression-tested before close-out.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (unchanged routes `/`, `/_not-found`, `/kit`), `npm test` ✓ (13 files, 101 tests), `npm run format:check` ✓. Five scripted profiles produce five visibly distinct index profiles; a strong-invalid session is gated `strong` with all-low confidence.

- **2026-06-23 · Phase 1.06 — assessment flow UI (task renderers + timing + flow + landing).**

  **No new dependencies.** All built on the already-installed stack (Next 16 / React 19, Tailwind v4, Motion + Lucide, next-intl, Vitest). The brief expected none; none were added.

  **New modules:** `src/features/timing/` (pure stopwatch + calibration + one React hook), `src/features/assessment/tasks/` (7 renderers + pure `view.ts` + shared `glyphs.tsx` + `task-screen.tsx`), `src/features/assessment/flow.ts`, the `/procena` flow screens, the real `/` landing, and 3 kit components (`answer-option`/`idle-nudge`/`reward-badge`). 3 new Vitest files (16 files / 133 tests total).

  **Config decisions / deviations:**
  - **Timing layer outside `src/features/assessment`** (D-070): the 1.05 purity test scans that tree's `.ts` files for a live clock; the timing hook (the app's only `performance.now`) is `.ts`, so it lives in `src/features/timing/` to keep the scan green. Pure cores (`stopwatch.ts`/`calibration.ts`) are node-tested; the renderers are `.tsx` (exempt) and browser-verified.
  - **Timing-shape contract flagged, not changed** (D-071): captured per-item timing is exactly the 1.05 `ResponseTiming` (`{ elapsedMs, idleGaps? }`); the device-calibration baseline has no field there, so it is captured at session level (inert, like `parentAssistMode`) for 3.01. The 1.05 layer is untouched.
  - **UI timing constants in `src/features/timing/constants.ts`** (D-072), re-exporting `IDLE_GAP_EXCLUDE_MS`/`TOO_FAST_MS` from the norms (single source of truth). Idle nudge at 22 s, suppressed during Gs.
  - **`noValidate` on the setup form** (D-075): native `min`/`max` constraint validation was silently blocking out-of-range submits (so the MK age-range message never showed); the app now governs the range check.
  - **next-intl client usage**: renderers/screens use `useTranslations` (client) under the existing root `NextIntlClientProvider`; the landing/route use `getTranslations` (server). All new parent/child copy added to `messages/mk.json` (plain MK, no jargon; child = encouragement only).
  - **Dev preview config** added at `.claude/launch.json` (`npm run dev`, autoPort) for the in-loop browser verification — tooling only.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (routes `/`, `/procena`, `/kit`, `/_not-found`), `npm test` ✓ (16 files, 133 tests), `npm run format:check` ✓. End-to-end walked in-browser: landing → age gate (3/4 blocked with MK message, 8/6 pass) → 5–7 parent confirm gates start → gf practice (series) → real (matrix) → all renderers eyeballed in `/kit` (Gv polygons, Corsi board, Gs grid + orange timer ring + auto-submit, EF tower, CT maze d-pad, condition arrows, idle nudge, reward badge).

- **2026-06-23 · Phase 1.07 — report engine (derived features + MK module library + assembly).**

  **No new dependencies.** Pure TypeScript on top of the existing 1.05 output + 1.03 UI kit; the dev preview reuses the already-built components (pentagon / band bar). The brief expected none; none were added.

  **New modules:** `src/features/report/` (pure derived-features → assembly → `ReportModel` + `selectReportSummary` + `{child}` resolver + Дел 11 program mapping), `src/content/modules/` (versioned MK module library, 11 files), the `/kit` report preview (`src/app/kit/report-preview.tsx`), and 7 new Vitest files (23 files / 169 tests total across the repo).

  **Config decisions / deviations:**
  - **`MODULE_LIBRARY_VERSION` = `1.0.0`** lives in `src/content/modules/version.ts`; **`REPORT_ENGINE_VERSION` = `1.0.0`** in `src/features/report/types.ts`. Both are carried in `ReportModel.meta` alongside the scoring / norms / task-bank versions and `normsStage` (threaded through from 1.05) — so every report is reproducible from a known content + engine version.
  - **Input contract — no widening of 1.05** (D-080): the report reads the per-item signals 1.05 already exposes (`SignalResult.perItem` + aggregates); option (a)/(b) from the brief was unnecessary.
  - **Read-only consumption** (resolved-decision 5): the engine never recomputes indices / bands / confidence / validity; narrative thresholds for style / shape / STEM-lead are report-local seeds in `features.ts`, never added to `seed-norms` (D-081).
  - **No child name → `{child}` token** resolving to „вашето дете" (D-078); module text is MK-only, multilingual-ready by schema (D-079).
  - **Voice lint** = a strict case-insensitive substring check over all parent-facing module text; copy authored to avoid every banned substring (incl. positive uses of „проблем"), brand „IQ UP!" allow-listed, internal `programHook` excluded (D-082).
  - **`ReportModel` is the single render contract** for 1.08 + 1.09; `IndexPresentation` carries the numeric index `value` for pentagon GEOMETRY only, never rendered as text (D-083). CTA carries **text only** (booking URL + `?grad=` are downstream).
  - **Purity enforced** by a static scan over `src/features/report` + `src/content/modules` (same forbidden set as 1.04/1.05). The MK module text uses the repo quote convention („ U+201E open · " U+201C close, matching `mk.json`); the spec's straight-quote closings were normalized.
  - **Disclaimer left to 1.10** — not built or embedded in `ReportModel`; the `/kit` preview shows the canonical Прилог D.4 text once, as a static placeholder.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (routes `/`, `/procena`, `/kit`, `/_not-found`), `npm test` ✓ (23 files, 169 tests), `npm run format:check` ✓. Browser-verified at `/kit`: five fixtures → five visibly distinct reports (pentagon + word/range bands, no number), the ceiling fixture shows the „го достигна врвот…" copy, strong-invalid shows the graceful-retry card; `{child}` resolves to „Вашето дете"; no console errors.

- **2026-06-23 · Phase 1.08 — lead form + confirmation screen; React Hook Form + Zod added.**

  **New dependencies (pinned EXACT, no caret — D-084…D-091 + the gap-fills below):**
  | Package | Version | Role |
  |---|---|---|
  | zod | 4.4.3 | Shared, framework-free validation schema (reused server-side in Part 2) |
  | react-hook-form | 7.80.0 | Form state + submission |
  | @hookform/resolvers | 5.4.0 | Zod resolver bridge (peer `react-hook-form ^7.55`; supports Zod 4) |
  | jsdom | 29.1.1 | **devDependency** — DOM env for the React component tests |
  | @testing-library/react | 16.3.2 | **devDependency** — render + query (React 19 compatible) |
  | @testing-library/dom | 10.4.1 | **devDependency** — RTL peer (queries) |
  | @testing-library/user-event | 14.6.1 | **devDependency** — (installed; the 1.08 tests use `fireEvent` for Radix robustness) |

  Resolver/Zod compatibility verified: `@hookform/resolvers` 5.4.0 peers `react-hook-form ^7.55.0` (satisfied by 7.80.0) and works with Zod 4; `zodResolver` imported from `@hookform/resolvers/zod`.

  **Config decisions / deviations:**
  - **Branched `phase-1.08-lead-form` from `main`, not from `phase-1.07-report-engine`** (D-092): PR #6 (the 1.07 branch) is already merged into `main` (commit `00beacf`), so the brief's "cut from `phase-1.07-report-engine`" fallback applied — cut from updated `main`.
  - **Required consents modeled as `z.boolean().refine(v => v === true)`** (D-093) rather than `z.literal(true)` — keeps the input type `boolean` so an un-ticked checkbox (`false`) is a valid default while the schema still rejects `false`/absent. Enforced in the schema, not only the UI.
  - **Schema error messages are stable TOKENS** (D-094) (e.g. `emailInvalid`, `consentServiceRequired`), mapped to MK in the form via `messages/mk.json`. Keeps the schema framework-free + server-reusable and all parent-facing copy in one place.
  - **`runLeadSubmit` is a pure, dependency-injected pipeline** (D-096) the form delegates to (persist → `lead_submit` → advance), so the submit ordering/args are Node-testable without a DOM — the 1.06 pure-core / thin-React split.
  - **First DOM tests in the repo** (D-095): `vitest.config.ts` now includes `*.test.tsx`; the global env stays `node`; the two React tests opt into `jsdom` per-file via a `// @vitest-environment jsdom` docblock (the pure suite stays Node-only). `@testing-library/react` + `jsdom` pinned; `fireEvent` used over `user-event` to avoid Radix pointer-capture machinery in jsdom (a few `Element.prototype` stubs guard the Radix primitives).
  - **`NEXT_PUBLIC_BOOKING_URL`** documented in `.env.local.example`; non-secret placeholder default `https://booking.example.invalid` lives in `src/features/lead/cta.ts` (resolved-decision 6). Real URL is a pending Cowork asset.
  - **Verbatim Прилог D copy** in `messages/mk.json` under a shared `legal` namespace (§D.2 data note + §D.4 disclaimer) + `leadForm` consents; the privacy-policy link inside `consent_service` renders via `t.rich` to `/politika-za-privatnost`.
  - **No real network in Part 1** — `submitLead`/`trackEvent` are inert seams; the engine/scoring/report modules are untouched (consumed read-only).

  - **Adversarial review pass** (automated review still unconnected): a multi-agent review of the diff surfaced 7 confirmed should-fix items; the substantive ones were fixed + regression-tested — submit guarded with RHF `isSubmitting` + try/catch + an MK `submitFailed` line (recoverable on a Part-2 network failure), field ids namespaced via `useId` (no collisions across the 3 `/kit` forms — verified 0 duplicate ids), the consent privacy-link `stopPropagation`s so it never toggles the consent, the end-phase render switch extracted to a testable `EndPhaseView`, and the retry confirmation branch added to the no-number guard. The privacy-link 404 (the `/politika-za-privatnost` page is a `.gitkeep` until 3.03) is by phase design — the link is correct + verbatim, left as carryover.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (routes `/`, `/procena`, `/kit`, `/_not-found`), `npm test` ✓ (**30 files, 209 tests**), `npm run format:check` ✓. Browser-verified at `/kit`: the form (empty / validation-error / missing-consent — required-consent failures show inline; 0 duplicate ids across the 3 instances) and the confirmation (pentagon + word/range bands, **no number**, booking href `…?grad=%D0%A1%D0%BA%D0%BE%D0%BF%D1%98%D0%B5`), graceful-retry variant; no console errors.

- **2026-06-23 · Phase 1.09 — branded PDF report; `@react-pdf/renderer` + bundled Montserrat TTFs added.**

  **New dependency (pinned EXACT, no caret — D-097):**
  | Package | Version | Role |
  |---|---|---|
  | @react-pdf/renderer | 4.5.1 | Server-side PDF generation of the report (the *generator*, NOT the `react-pdf` pdf.js viewer). Latest; peers React `^19` (satisfied by 19.2.4). |

  *(@react-pdf pulls transitive `fontkit`, `yoga-layout`, `@react-pdf/*`. `npm audit` reports 2 moderate advisories in transitive deps — server-side only, no route imports it in Part 1; revisit at 2.02 wiring.)*

  **Bundled assets (committed, OFL-licensed — D-097):** `src/features/report/pdf/fonts/Montserrat-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf` (static TTFs, weights 400/500/600/700/800; full Macedonian Cyrillic + Latin coverage verified via `fontkit`) + `OFL.txt`. Sourced from the canonical JulietaUla/Montserrat distribution. This PDF font pipeline is **independent** of the web `next/font/google` pipeline (`@react-pdf` cannot use woff2).

  **Config decisions / deviations:**
  - **Branched `phase-1.09-pdf-report` from `main`** (D-101): PR #7 (the 1.08 branch) is already merged into `main`, so the brief's "branch from `phase-1.08-lead-form`, or `main` if #7 is merged" fallback applied (mirrors D-092).
  - **`next.config.ts` adds `serverExternalPackages: ["@react-pdf/renderer"]`** so the 2.02 `/api/report` route can import the render seam unchanged (run as a Node external, not bundled). Harmless until then — nothing imports the PDF module into the Next app in Part 1, so `next build` routes are unchanged (`/`, `/procena`, `/kit`, `/_not-found`).
  - **Pure builder + IO seam split** (mirrors 1.06/1.08): `buildReportDocument(model, { bookingHref })` is a pure function of `ReportModel` (purity-scanned); the IO lives in `fonts.ts` (`Font.register` from disk, path via `process.cwd()` — never `process.env`) and `render.ts` (`renderToBuffer` + `resolveBookingUrl`). `renderReportPdf(model, { city })` is the 2.02 contract.
  - **PDF chrome strings** in a new `reportPdf` namespace in `messages/mk.json`, imported **statically** into the pure builder (not via next-intl async/context), reusing `legal.disclaimer`/`legal.dataNote` (D-099).
  - **Render-to-buffer + dev dump script** (`scripts/dump-report-pdf.ts` → gitignored `./tmp/`) over an in-browser `@react-pdf` `PDFViewer` for QA (D-098).
  - **§D.4 disclaimer top (first flow element) + a `fixed` footer on every page bottom**; the §D.2 data note + the full Дел 10.3 report content (incl. all-five per-index home activities) render from the `ReportModel` (D-100).
  - **`@react-pdf` SVG `Text` type gap**: its typings omit `fontSize`/`fontFamily`/`fontWeight` (runtime supports them) → a single `SvgText` cast in `pentagon-pdf.tsx`. `fontkit` ships no types → a 1-line ambient `src/types/fontkit.d.ts` (test-only use).
  - **No new runtime wiring**: no route, no network, no send/store — the PDF is only generated (the dump script + tests exercise it). Engine/scoring/report consumed read-only.

  **Adversarial review pass** (CodeRabbit/Codex still unconnected): a 5-dimension multi-agent review (purity/determinism, no-number/two-register, content-completeness, edge-cases, test-quality) with adversarial verification of each finding — **no must-fix items**. Three confirmed should-fix items were fixed + regression-tested: the fixed-footer paddingBottom bumped to 72 (buffer against a future disclaimer line-wrap; still 2 pages), the font-coverage test extended to the Latin STEM glyphs, and a **sync-guard test** added (PDF `theme.ts` band/confidence maps must equal the components' now-exported `BAND_FILL`/`BANDS[*].level`/`CONFIDENCE`). Nits left as-is/handled: a builder determinism test was added; the i18n `ctaFallback` ("Закажи бесплатен демо час") is consistent with the engine's own fallback so it stays; a render-test comment was de-overclaimed.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (routes unchanged), `npm test` ✓ (**35 files, 232 tests**), `npm run format:check` ✓. Visual QA via the dump script + `pymupdf` rasterization: all five fixtures render — four 2-page profiles (branded puzzle-brain header, color-coded pentagon, five word/range bands + confidence, strength/growth/style, per-index activities, Part Б, positioning + program, clickable CTA `…?grad=`, §D.4 top + footer) and the 1-page strong-invalid retry (dim brain, graceful-retry message, no pentagon). Macedonian Cyrillic (incl. Ѓѓ/Ќќ/Љљ/Њњ/Џџ/Ѕѕ/Јј) renders with no tofu.

- **2026-06-23 · Phase 1.10 — shared „informative, not diagnostic" disclaimer, static page shells & 7-placement audit. NO new dependencies; NO config changes.**

  **No new packages, no `package.json` / `next.config.ts` / `vitest.config.ts` changes.** Everything used (next-intl, the UI kit, `@react-pdf`, Vitest + jsdom) was already installed.

  **New files:** `src/components/ui/disclaimer.tsx` (the shared `Disclaimer` + `DISCLAIMER_KEYS`), `src/app/(site)/page-shell.tsx` (shared static-page chrome), `src/app/(site)/{za-testot,politika-za-privatnost,uslovi}/page.tsx` (the three routable shells, replacing the reserved `.gitkeep` folders), and four test files (`components/ui/__tests__/disclaimer.test.tsx`, `report/pdf/__tests__/disclaimer-parity.test.ts`, `(site)/__tests__/static-pages.test.tsx`, `(site)/__tests__/disclaimer-single-source.test.ts`, `(site)/__tests__/disclaimer-placements.test.tsx`).

  **i18n:** `messages/mk.json` gains `legal.disclaimerShort` (the single §16.1 short line), a `pages` namespace (`about`/`privacy`/`terms` copy), and `common.home`; the duplicate `landing.disclaimer` + `prestart.disclaimer` short keys are **removed** (single source).

  **Config decisions / deviations:**
  - **Branched `phase-1.10-disclaimer-static-pages` from `main`** (D-103): PR #8 (the 1.09 branch) is already merged (`ad51f18`), so `main` is the current chain tip (mirrors D-101/D-092).
  - **`Disclaimer` is an isomorphic next-intl component (no `"use client"`)** and the new static pages are **sync Server Components** using `useTranslations` for the body + async `generateMetadata` using `getTranslations` (mirrors `procena/page.tsx`); a shared `page-shell.tsx` gives consistent chrome (D-104). `build` confirms `/za-testot`, `/politika-za-privatnost`, `/uslovi` prerender as static (○).
  - **PDF top = full §D.4 / footer = short line** (D-105, refines D-100): `document.tsx` footer changed from `legal.disclaimer` to `legal.disclaimerShort`; the top stays full. `document.test.ts` updated (top full=1, footer short=1). `paddingBottom:72` is now generous headroom for the one-line footer.
  - **Single source guarded by tests, not a shared import** (the pure node PDF builder can't import the DOM component): the `Disclaimer` and `document.tsx` both read the same `legal` mk.json keys; a `disclaimer-parity` test ties the PDF to `DISCLAIMER_KEYS`, a `disclaimer-single-source` test forbids hardcoded copy + asserts one mk.json occurrence each, and a `disclaimer-placements` test render-checks #2 + source-checks #1. Mirrors the `pentagon.ts`/`pentagon.tsx` split + the 1.09 theme sync-guard.
  - **5-wired / 2-deferred placement split** (D-102): #1/#2/#3/#4/#6 wired now; #5 e-mail (2.02) + #7 cookie banner (3.03) copy-ready in `legal.*` (hosts not stubbed).
  - **No runtime wiring changed**: no network, no store, no new env. Flow/engine/scoring/report/PDF-layout untouched except the disclaimer swap.

  **Adversarial review pass** (CodeRabbit/Codex still unconnected): a 5-dimension multi-agent review (single-source/parity, spec/two-register/a11y, next-intl/RSC, test-quality, repo-fit/edge) with adversarial verification of every finding — **no must-fix items**; 2 confirmed should-fix (render coverage for placements #1/#2; a retry-branch disclaimer assertion) fixed + regression-tested; cheap nits also handled (stale PDF padding comment refreshed; About-page + confirmation assertions strengthened). The §D.2-vs-§D.4 separation concern was refuted (already caught by the verbatim `.toBe` component test). Documented nit, no code change: no in-app nav links `/za-testot` + `/uslovi` yet (placement #6 is satisfied by the page hosting the disclaimer; footer nav arrives with later chrome).

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (7 routes; the 3 new pages prerender static), `npm test` ✓ (**40 files, 248 tests**), `npm run format:check` ✓. Browser QA (preview server): `/za-testot` renders H1 + is/isn't + the full §D.4 disclaimer (`<p data-disclaimer="full">`) and stacks single-column on mobile; the landing footnote renders the short `<p data-disclaimer="short">` in `text-muted`; `/politika-za-privatnost` + `/uslovi` return 200 with correct H1 + MK `<title>`; `/kit` shows both registers; zero console + server errors.

- **2026-06-24 · Phase 2.01 (Code) — anonymous-scores DB: schema migration + server write path + Supabase client.**

  **New dependencies (runtime, pinned EXACT — D-097-style no-caret):**
  | Package | Version | Role |
  |---|---|---|
  | @supabase/supabase-js | 2.108.2 | Postgres/PostgREST client; service-role insert (server) + anon RLS check (verify script) |
  | server-only | 0.0.1 | Build-time guard so the service-role client can never be imported into a client bundle |

  **New devDependency:** `supabase` 2.107.0 (the CLI; downloads a platform binary). *(Local quirk, NOT committed: the npm-shipped arm64 binary arrived linker-signed and was SIGKILL'd by the kernel until `codesign --force --sign -` re-signed it ad-hoc — D-114. `npm audit` still reports the 2 pre-existing moderate advisories from `@react-pdf` transitive deps; unchanged.)*

  **New modules:** `supabase/` (CLI scaffold via `supabase init`: `config.toml` + `.gitignore`) + `supabase/migrations/20260624021436_create_scores.sql`; `src/lib/supabase/server.ts` (server-only service-role client); `src/features/scoring/persist/` (`buildScoreRow` + strict `scoreRowSchema` + barrel); `src/app/api/score/route.ts` (the `POST` route); `src/features/lead/score.ts` (client `writeScore`/`postScore`); `scripts/{dump-score-row,verify-scores-db}.ts`. 3 new test files (route + score-row + migration parity) and the extended `lead/submit` test.

  **Config decisions / deviations:**
  - **Branched `phase-2.01-anonymous-scores-db` from `main`** (D-115): PR #9 (1.10) is merged (`1cf1215`), so `main` is the chain tip (mirrors D-103/D-101/D-092).
  - **`scores` table = anti-join by construction** (D-106): random `id` shared with nothing + DATE-ONLY `created_date` (`default current_date`, NO `created_at`/timestamp). RLS enabled, NO policies — only the service role writes (D-107). Documenting table/column comments (no-PII / no-join).
  - **Column types follow the LIVE enums, not the brief's wording** (D-109): `validity_status in ('ok','mild','strong')` (not "none"); confidence `('high','medium','low')` (not "med"); index/signal values `smallint check between 0 and 100` (live values clamp to 8–99). The 5 index columns are descriptive (`memory_focus`/`planning_speed`/`learning_stem`) via the one tested `INDEX_COLUMN` map (D-108); the 5 `conf_*` confidence columns are included (D-112).
  - **`environment` stamped SERVER-side from `APP_ENV`** (D-110, default `development`); the strict Zod schema has no `environment`/`created_date` field, so client-supplied values are rejected (400). New env: `APP_ENV` (+ the Supabase keys) added to `.env.local.example` (names only).
  - **Pure builder + server IO split**: `buildScoreRow` is pure (covered by the existing scoring `purity` scan, which recurses into `persist/`); `scoreRowSchema` is the single source of the row shape (`ScoreRow = z.infer`); the client builds the row and `/api/score` re-validates with the SAME schema (D-113). `age` is pulled from `result.meta`, not re-passed.
  - **Score write wired non-blocking** (D-111): `runLeadSubmit` fires `writeScore` first (try/catch-guarded; itself fire-and-forget + self-catching) so a failed write never blocks confirmation/PDF; coarse demographics only, no shared key with the lead.
  - **Migration applied via `supabase db push --db-url <session-pooler>`** (D-114; no access token available — `link` needs API auth). `next.config.ts` / `vitest.config.ts` unchanged.

  **Adversarial review pass** (CodeRabbit/Codex still unconnected): a 6-dimension multi-agent review (privacy/anti-join, security/RLS, correctness/mapping, route/Zod edge cases, test quality, repo-fit) with adversarial verification of every finding — **9 raised, 5 confirmed, 0 must-fix**. The 3 should-fix were fixed: a real `score.test.ts` covering the production `writeScore`/`postScore` non-blocking path (fetch mocked: 500 + network reject, no unhandled rejection); `current-state.md` updated; the completion report filed. The 2 nits were fixed: the migration parity test now anchors each `conf_*` CHECK to its column, and `dump-score-row.ts` uses relative imports like the other dump scripts. _(Details in the completion report.)_

  **Live verification (real EU project `rdhvpypbwefmafejclfy`, eu-central-1):** migration applied (`supabase db push` → "Finished"); a real `POST /api/score` through the running dev server returned **201** and inserted ONE row; `scripts/verify-scores-db.ts` confirmed — service role reads the table (1 row), **anon CANNOT read** (0 rows) **or insert** (Postgres `42501`), the row is **date-only** (`created_date=2026-06-24`, no time), versions `1.0.0/1.0.0/1.0.0`+`stage=seed`, `environment=development`, **30 columns, no PII column**.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (route `ƒ /api/score` added; `server-only` guard holds), `npm test` ✓ (**44 files, 290 tests**), `npm run format:check` ✓.

- **2026-06-24 · Phase 2.02 (Code) — Brevo lead capture + transactional PDF e-mail. NO new dependencies.**

  **No new packages.** The Brevo client uses the built-in `fetch` (Node 18+); the PDF reuses the already-pinned `@react-pdf/renderer` 4.5.1 (1.09). No `package.json` / `next.config.ts` / `vitest.config.ts` changes. `npm audit` unchanged (the 2 pre-existing moderate advisories from `@react-pdf` transitive deps remain).

  **New modules:** `src/lib/env.ts` (shared `resolveEnvironment`, extracted from the 2.01 score route — D-120); `src/lib/brevo/server.ts` (server-only client: `upsertLeadContact` + `sendReportEmail` + `resolveBrevoListId` + `BrevoError`); `src/lib/brevo/email-template.ts` (pure `buildReportEmail` → `{subject,html,text}`); `src/app/api/lead/route.ts` (the `POST` route). 3 new test files (`brevo/__tests__/server.test.ts`, `brevo/__tests__/email-template.test.ts`, `app/api/lead/__tests__/route.test.ts`). `messages/mk.json` gains the `email` namespace (verbatim Прилог D.3). `.env.local.example` documents the 5 `BREVO_*` vars.

  **Config decisions / deviations:**
  - **Branched `phase-2.02-brevo-lead-email` from `main`** (D-116): PR #10 (2.01) is merged (`c60f2aa`), so `main` is the chain tip (mirrors D-115/D-103/D-101/D-092).
  - **Server-only Brevo client** (`import "server-only"` + non-`NEXT_PUBLIC_` `BREVO_API_KEY`) mirrors `src/lib/supabase/server.ts`. Two ops: `upsertLeadContact` (`POST /v3/contacts`, `updateEnabled:true`, `listIds:[7|8]`, 8 custom attrs) + `sendReportEmail` (`POST /v3/smtp/email`, sender from `BREVO_SENDER_EMAIL`/`_NAME`, html+text, PDF base64 attachment). Errors surface as a PII-free `BrevoError` (endpoint+status+Brevo `code` only — never the message).
  - **One route, no `/api/report`** (D-117): `/api/lead` validates → upserts (gate) → re-assembles (`assembleReport`, server-side, from the posted `AssessmentResult` — D-118) → renders (`renderReportPdf`, in-process) → best-effort e-mails (D-119). `api/report/` stays reserved. The score write is untouched (2.01) and is NOT merged in (`/api/score` stays separate, non-blocking).
  - **List = environment, not consent** (D-120): `resolveBrevoListId` uses the shared `resolveEnvironment` so production → list 7 / dev+preview → list 8 ALWAYS agrees with the `scores.environment` stamp. Marketing consent is a stored flag (`CONSENT_MARKETING`), enforced later at export/campaign time (2.04), never by list membership.
  - **Server-derived fields**: `LANGUAGE` = `"mk"` (active locale) and `CONSENT_DATE` = today `YYYY-MM-DD` are set server-side (the client sends neither, and client-sent values are ignored). `CHILD_GENDER` is the stable code (`male`/`female`/`undisclosed`, matching the score row), `""` if absent. The contact carries ZERO score/result fields (unjoinable, §14.1).
  - **`submitLead` is now real**: POSTs `{ ...values, result }` to `/api/lead`, rejects on a non-2xx (form shows an error, no confirmation). The 1.08 lead-form DOM test now stubs `fetch`; the 1.08 submit test asserts the real POST shape.
  - **§16.1 placement #5 (e-mail)** is satisfied — the e-mail footer reads `legal.disclaimer` from `messages/mk.json`; the 1.10 single-source guard stays green (the builder references the JSON, never a hardcoded literal). Placements live = **6 of 7** (only #7 cookie banner → 3.03 remains).

  **Adversarial review pass** (CodeRabbit/Codex still unconnected): self-review — no must-fix found. Key checks: the Brevo secret never reaches a client bundle (`server-only` + non-`NEXT_PUBLIC_` key); no PII in logs (field paths + endpoint/status/code only); the upsert-failure path skips the e-mail; the best-effort path swallows render/send failures; the unjoinable invariant holds (the contact attribute set has no score keys). 32 new tests cover endpoints/attrs/list, copy↔mk.json, validation/gate/best-effort/unjoinable, and 5-fixture re-assembly equality.

  **Live verification (real Brevo account, EU):** a real `POST /api/lead` through the running dev server returned **200 `{ok:true}`**; Brevo → Contacts shows `iqup-2-02-verify@example.com` on **list 8 (Test)** with `FIRSTNAME=Тест-Родител`, `PHONE`, `CITY=Скопје`, `CHILD_GENDER=female`, `LANGUAGE=mk`, `CONSENT_SERVICE/PARENT/MARKETING=true`, `CONSENT_DATE=2026-06-24`, and **no score/result attribute**. The e-mail path is well-formed (`/v3/smtp/email` accepted, HTTP 201); the production sender `noreply@iqup.mk` is blocked pre-DNS (Cowork carryover) so real delivery was proven via the **verified gmail sender** (HTTP 201 + messageId; PDF rendered = 42 KB, attached). The shipped sender stays `noreply@iqup.mk` (no `.env.local` / code change).

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (route `ƒ /api/lead` added; `server-only` guards hold), `npm test` ✓ (**47 files, 323 tests**), `npm run format:check` ✓.

- **2026-06-24 · Phase 2.04 (Code) — admin panel (Supabase Auth + 2FA, stats, contacts, CSV export).**

  **New dependency (runtime, pinned EXACT — no caret, D-097-style):**
  | Package | Version | Role |
  |---|---|---|
  | @supabase/ssr | 0.12.0 | Cookie-based Supabase Auth for the admin panel (browser + server SSR clients, middleware session refresh). Peers `@supabase/supabase-js ^2.108.0` (satisfied by 2.108.2). |

  *(No other deps. `npm audit` unchanged — the 2 pre-existing moderate advisories from `@react-pdf` transitive deps remain.)*

  **New DB objects (live, EU project `rdhvpypbwefmafejclfy`), applied via `supabase db push --db-url <session-pooler>` (D-114 invocation; the CLI binary ran cleanly this time — no re-sign needed):**
  - `public.admin_users` — allowlist (`user_id` PK → `auth.users`, optional `label`, `created_at`). RLS on, NO policies.
  - `public.admin_export_log` — PII-free export audit (`id`, `actor_user_id`, `export_type`, `filters jsonb`, `row_count`, `created_at`). RLS on, NO policies.
  - `public.score_band(integer)` + `public.admin_score_stats(text)` — aggregates-only stats RPC over `public.scores`; `security invoker`; execute REVOKED from `anon`/`authenticated`/`public`, GRANTED to `service_role` only (D-126). Four migration files (`20260624120000…120300`), tracked in `supabase_migrations`.

  **New modules:** `src/lib/supabase/{admin-browser,admin-server,admin-guard}.ts`; `src/middleware.ts`; `src/features/admin/{contacts,csv,stats,audit,index}.ts`; `src/app/admin/{layout,admin-shell,sign-out-button,page}.tsx` + `login/{page,login-form}.tsx` + `contacts/page.tsx`; `src/app/api/admin/export/route.ts`; `scripts/verify-admin-db.ts`. `messages/mk.json` gains the `admin` namespace. `src/lib/brevo/server.ts` extended with `BREVO_CONTACT_ATTRIBUTES` + `listContactsFromList` + `fetchAllContactsFromList` (read + export only). 9 new test files.

  **Config decisions / deviations:**
  - **Branched from `main`** (D-125): PR #11 (2.02) is merged (`9142f76`), so `main` is the chain tip (mirrors D-116…).
  - **`requireAdmin()` is the real boundary** (session + aal2 + allowlist), called by every admin page + the export route; `src/middleware.ts` only refreshes the session + redirects unauthenticated `/admin/**` → `/admin/login` (login excluded). Verified live: `/admin` + `/admin/contacts` redirect to login; `/api/admin/export` returns 401 with no data (D-124).
  - **Stats aggregation runs IN Postgres** via the `admin_score_stats` RPC; only aggregates cross the boundary; band thresholds in SQL `score_band()` guarded by a code↔SQL parity test (D-126).
  - **Two stores never join** (D-121): the contacts view + CSV carry NO age and NO results; stats read ONLY scores; a static-scan test asserts no admin file reads both a contact identity and a score.
  - **Export audit is FAIL-CLOSED** (D-127); the audit row is PII-free (D-122).
  - **`/admin/**` is `noindex`** (admin `layout.tsx` metadata `robots: { index:false, follow:false }`), not linked from any public nav.
  - **Next 16.2 deprecation kept** (D-128): `src/middleware.ts` works (registered as "Proxy (Middleware)") but prints a `middleware`→`proxy` deprecation warning; rename is a trivial future change.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓ (routes `ƒ /admin`, `ƒ /admin/contacts`, `○ /admin/login`, `ƒ /api/admin/export`; middleware registered), `npm test` ✓ (**56 files, 384 tests**), `npm run format:check` ✓. Live: all four migrations applied; `scripts/verify-admin-db.ts` → ALL CHECKS PASSED (tables exist + RLS-locked, RPC returns aggregates for the service role, anon denied `42501`).

- **2026-07-02 · Phase 2.06 (Code) — task bank v2: research-calibrated difficulty + stimulus upgrade.**

  **No new dependencies.** All work is content/config/logic on the existing pinned stack (Next 16 / React 19 / TS strict / Vitest 4.1.9).

  **Version stamps (semver, stored per anonymous record):**
  | Constant | Old | New | Why |
  |---|---|---|---|
  | `TASK_BANK_VERSION` | 1.0.0 | **2.0.0** | items + answer keys change for a given seed (MAJOR) |
  | `NORMS_VERSION` | 1.0.0 | **2.0.0** | every ladder/start/expectation/threshold recalibrated from research |
  | `SCORING_VERSION` | 1.0.0 | **2.0.0** | accuracy family recentred per signal × age; EF/Glr level-weighted; banded attention normalisation; Corsi backward offset 2 → 0.5 (D-138) |

  Old `scores` rows stay comparable via their stored stamps (D-134); `meta.normsStage` stays `"seed"` (the persist schema pins the literal; norms remain pre-pilot).

  **Config surface changes (no env vars, no DB changes):**
  - `src/content/tasks/levels.ts` — v2 ladders for all 7 families + `UX_BY_AGE` + `GS_BY_AGE` (absorbs `GS_LEVEL_BY_AGE`/`GS_WINDOW_SEC`) + `GSM_ISI_MS = 400`, board-size + under-8-substitution lookups.
  - `src/content/norms/seed-norms.ts` — per-signal `START_LEVELS` (shared table deleted), v2 item caps (lone 5/6/7, shared 4/5/6), `ATTENTION_BANDS`, `PROVISIONAL_NORMS` register, per-age anchors; deleted: `START_LEVEL_BY_AGE`, `GS_LEVEL_BY_AGE`, `GS_WINDOW_SEC`, `GLR_LEVEL_BY_AGE`, `GLR_ROUNDS_BY_AGE`, `BACKWARD_SPAN_OFFSET` (→ `CORSI_BACKWARD_OFFSET = 0.5`), `SPAN_CEILING_CONSECUTIVE_ERRORS`, `GSM_MIN_SPAN`, `ATTENTION.cvCap`, `TOO_FAST_FRACTION_STRONG`, `CHANCE_ACCURACY_4OPT` (→ `chanceAccuracyForAge`).
  - `.claude/launch.json` added (dev-server config for local preview tooling; not runtime config).

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓ (0 problems), `npm run build` ✓, `npm test` ✓ (**59 files, 448 tests**), `npm run format:check` ✓.

- **2026-07-04 · Phase 3.01 + 3.01R (Code) — validity/time hardening, reconciled with 2.06's age-banded cut-offs.**

  **No new dependencies, no env vars, no DB changes.** Mechanics-only on the existing pinned stack (Next 16 / React 19 / TS strict / Vitest 4.1.9). All three version stamps stay **2.0.0** — no item / norm / scoring VALUE is re-tuned.

  **Config surface (validity threshold seeds, `src/content/norms/seed-norms.ts`):**
  - **3.01** added the threshold-modulation block — `resolveValidityThresholds(ctx)` + `ValidityContext` / `ValidityThresholds`, `YOUNG_VALIDITY_MAX_AGE`, `MAX_IDLE_PAUSES_{YOUNG,ASSISTED}`, `TOO_FAST_BASELINE_MULT`, `TOO_FAST_MS_{FLOOR,CEIL}` — and re-introduced `TOO_FAST_FRACTION_STRONG` (the flat base; 2.06 had deleted it). A session-level `ScoringContext` on `finalize(state, context?)` (scoring `index.ts`) threads `parentAssistMode` + `deviceBaselineMs` without widening the per-item `ResponseTiming` contract (D-142). New tree `src/features/progress/` (localStorage, anonymous, unjoinable — D-144).
  - **3.01R reconciliation (D-146):** the too-fast STRONG **fraction**'s age axis is now 2.06's `ATTENTION_BANDS[].commission` (the single source of age); the young-band fraction seeds `TOO_FAST_FRACTION_STRONG_{YOUNG,ASSISTED}` are **removed**; parent-assist is now the additive `TOO_FAST_FRACTION_ASSIST_DELTA = 0.1` clamped by `TOO_FAST_FRACTION_STRONG_MAX = 0.6`; the young 5–7 relaxation survives only for the idle count; device-relative ms unchanged; `TOO_FAST_FRACTION_STRONG` kept as the ageless fallback. New seeds stay OUT of `PROVISIONAL_NORMS` (mirroring 3.01's other threshold seeds, so the register's pinned key-set is untouched). Shipped on branch `phase-3.01R-threshold-reconcile` off the merged `main` `fb54d1d` (D-147), since the original 3.01 branch already merged as PR #14.

  **Verification:** `npm run build` ✓ (TypeScript + all 10 routes generate; the `middleware`→`proxy` deprecation warning is the pre-existing D-128 carryover), `npm test` ✓ (**68 files, 500 tests**).

- **2026-07-04 · Phase 3.02 (Code) — performance & accessibility tooling.**

  **New devDependencies (pinned exact, local audit tooling only — not shipped to the app):**
  | Package | Version | Purpose |
  |---|---|---|
  | `lighthouse` | `13.4.0` | CLI Lighthouse runs (Performance/A11y/Best-Practices/SEO) against a local production build. |
  | `@axe-core/cli` | `4.12.1` | Automated axe-core WCAG scans via a real headless Chrome. |
  | `chromedriver` | `149.0.4` | Pinned to match the local Chrome major version for `@axe-core/cli`'s selenium-webdriver driver — **re-pin per machine** if the installed Chrome version differs (see `docs/perf-a11y-audit.md`). |

  No runtime dependency, env var, or DB change. `next.config.ts` unchanged. Four index `*-ink` hex values re-darkened in `globals.css` + `src/lib/indices.ts` (contrast fix, D-151) — same tokens, no new tokens added. New MK string: `common.loading`.

  **Verification:** `npm run build` ✓, `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓ (**69 files, 502 tests**). Full Lighthouse/axe/contrast numbers in `src/_project-state/completions/Part-3-Phase-02-Completion.md`.

- **2026-07-10 · Feat (Code) — Serbian (Latin) localization: SR added as a second locale next to MK. NO new dependencies.**

  **No new packages.** next-intl 4.13.0 (already pinned) gains i18n routing; the Serbian latinica support is a **font-subset config change**, not a dependency (D-160).

  **Config surface changes (no env vars, no DB changes):**
  - **`src/app/fonts.ts` (new)** — the shared `next/font/google` Montserrat instance moved here, with subsets **`["latin", "latin-ext", "cyrillic"]`** (added `latin-ext` for č ć š ž đ; the web app). The bundled `@react-pdf` Montserrat static TTFs already cover latinica (verified by a fontkit glyph-coverage test — no font file change).
  - **next-intl 4 i18n routing enabled** — `src/i18n/routing.ts` (`defineRouting`, single canonical locale list `["mk","sr"]`, `defaultLocale: "mk"`, `localePrefix: "as-needed"`, `localeDetection: false`), `src/i18n/navigation.ts` (`createNavigation`), `src/i18n/metadata.ts` (hreflang/og-locale helpers); `src/i18n/request.ts` rewritten to resolve `requestLocale` + `hasLocale`. `next.config.ts` still points the plugin at `./src/i18n/request.ts` (unchanged). `src/middleware.ts` composes `createMiddleware(routing)` with the 2.04 admin session refresh (matcher broadened to all non-api/asset paths; `/admin` + `/kit`/`/embed` branched out) (D-163).
  - **App tree restructure (D-163):** `app/(site)/**` → `app/[locale]/(site)/**`; root `app/layout.tsx` is now a pass-through (`import "./globals.css"` + returns children); new `app/[locale]/layout.tsx` + `app/kit/layout.tsx` + updated `app/admin/layout.tsx` render `<html>` via the shared `app/root-document.tsx`. `/` + `/procena` + the three static pages are statically generated for BOTH `/mk*` and `/sr*` (● SSG).
  - **`messages/sr.json` (new)** — full Serbian (Latin) bundle, exact key + array-shape parity with `mk.json` (parity-tested). `mk.json` switcher keys: dropped `landing.langEn`/`langDisabledNote`, added `landing.langSr` + `landing.langSwitcherLabel`.
  - **`MODULE_LIBRARY_VERSION` 1.0.0 → 1.1.0** (MINOR, D-164) — every report module gained an `sr` register; MK output byte-for-byte unchanged; carried only in `ReportModel.meta`, NOT in the anonymous score row.
  - **Vitest:** `resolve.alias` (array form) aliases `@/i18n/navigation` → `test/mocks/i18n-navigation.tsx` (jsdom-safe stub, D-167). No production config touched by this.

  **Verification:** `npm run typecheck` ✓, `npm run lint` ✓, `npm run format:check` ✓, `npm run build` ✓ (16 pages, MK + SR SSG; the pre-existing D-128 `middleware`→`proxy` warning remains), `npm test` ✓ (**73 files, 529 tests**). In-browser: `/` = MK (`<html lang="mk">`), switcher → `/sr` = Serbian (`<html lang="sr">`, `Otkrijte kako razmišlja vaše dete`), locale-aware links keep `/sr`, switcher not rendered inside `/procena`, hreflang MK↔SR + `og:locale` present, zero console errors. SR PDF (42 KB) + e-mail assemble in Serbian with real latinica.
