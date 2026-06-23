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
