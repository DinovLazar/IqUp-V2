# IqUp-V2 — Phase Plan

> The living index of every phase across the three-part build. Each phase is **one completion report = one git commit** per executing Claude session. Phases open **one at a time** — Chat doesn't open the next until the current phase's completion report is filed in `src/_project-state/completions/` and `current-state.md` is updated.
>
> **Numbering:** `1.01`, `1.02`, … then `2.01`, etc. · **Type:** Code / Design / Cowork / combo.
>
> Mark a phase done by checking it here and in `notion-checklist.md` when its completion report is filed.
>
> **Version:** 1.0 · **Created:** 2026-06-21

---

## Part 1 — Local build

Everything working on Lazar's machine, with integrations stubbed out (no live Brevo/Meta/GA4/DB yet).

| # | Phase | Type | Scope |
|---|---|---|---|
| 1.01 | Scaffold & foundations | Code | Create the GitHub repo (`DinovLazar/IqUp-V2`, public, single-branch `main`, branch protection, CodeRabbit + Codex) and scaffold Next.js + TypeScript + Tailwind + shadcn/ui. Set up next-intl (Macedonian). **Create the reserved folders `docs/design-handovers/` and `src/_project-state/`** and seed the state files. Place `CLAUDE.md` + `AGENTS.md`. |
| 1.02 | Design system & key screens | Design | Visual direction agreed in chat first, then deliver design tokens, the puzzle-brain / pentagon motif, component specs, and mockups of the landing, a test screen, and the report. Save the handover to `docs/design-handovers/`. |
| 1.03 | Base UI kit | Code | Implement the brand tokens as the Tailwind theme and build the base components (buttons, cards, badges, progress, form fields, the pentagon component) from the Design handover. |
| 1.04 | Task bank + procedural generators | Code | Deterministic, seedable generators for all 8 signals (Gf matrices/series, Gv rotation SVG, Gsm Corsi span, Gs speed grid, EF Tower of London, Glr paired-associate, CT sequencing/debug/loop/condition/maze) per the spec's Appendix A. |
| 1.05 | Adaptive engine + scoring + norms | Code | Basal/ceiling adaptive logic, per-age start levels, raw scores → 0–100 indices, the seed norms (Appendix B), confidence-by-domain, validity flags, time rules, and extreme handling. |
| 1.06 | Assessment flow UI | Code | Wire the screens — landing → setup (age) → practice items → adaptive sections → completion + child reward badge — onto the engine and UI kit. Silent timing; idle/tab-blur handling with the gentle "all good?" nudge. |
| 1.07 | Report engine | Code | The 3-layer deterministic engine (signals → derived features → module library + assembly) with the Macedonian module library (Appendix C), the pentagon hybrid presentation, the STEM-bridge, the solving-style description, and the dynamic CTA text. |
| 1.08 | Lead form + confirmation screen | Code | The form (fields + three separated consents) with React Hook Form + Zod validation, and the on-screen confirmation (pentagon summary + CTA). Integrations stubbed. |
| 1.09 | Branded PDF report | Code | The @react-pdf/renderer layout mirroring the on-screen report (pentagon, bands, sections, confidence labels, disclaimer), generated from the scores. Send stubbed. |
| 1.10 | Static pages + disclaimer placements | Code | About-the-test, Privacy, and Terms page shells, plus the reusable "informative, not diagnostic" component placed in all 7 spots. Final legal copy is dropped in at Phase 3.03 after lawyer review. |

## Part 2 — Integrations + Vercel preview

Wire the real services and deploy to a private preview URL.

| # | Phase | Type | Scope |
|---|---|---|---|
| 2.01 | Anonymous-scores database | Code + Cowork | Cowork creates the Supabase project (EU region); Code builds the no-PII scores schema, the write path from the flow, and the per-record version field. |
| 2.02 | Brevo (leads + PDF email) | Code + Cowork | Cowork sets up the Brevo account, list, and transactional template and puts the API key in Vercel's env; Code wires lead creation + the transactional PDF send. |
| 2.03 | Meta CAPI + GA4 | Code + Cowork | Cowork supplies the pixel ID + GA4 property; Code wires the server-side `Lead` event (with `event_id` dedup) and the funnel events from Appendix F. |
| 2.04 | Admin panel | Code | Supabase Auth (2FA, roles, access logging); contacts view (no results), stats by age/gender/city, CSV export + Brevo sync, marketing-consent-only export. Contacts come from Brevo; the two stores stay unjoined. |
| 2.05 | Vercel preview deploy | Code + Cowork | Cowork connects the repo to Vercel and sets the env vars; Code ships a preview URL and runs an end-to-end smoke test (analytics + Meta stay off outside production). |

## Part 3 — Polish + production cutover

Harden, pass the quality bar, finalize legal, and go live.

| # | Phase | Type | Scope |
|---|---|---|---|
| 3.01 | Validity / edge-case / time hardening | Code | Full pass on validity flags, extremes, idle/tab-blur, device calibration via the first practice item, repeat-test new-set generation, and local progress storage. |
| 3.02 | Performance + accessibility | Code | Lighthouse 95+ (mobile + desktop), a WCAG 2.2 AA audit, reduced-motion, keyboard/focus, contrast, lazy-load by section, and first load < 2.5s on 4G. |
| 3.03 | Legal finalization + cookie banner | Code + Cowork | Cowork shuttles the lawyer-approved policy/terms/consent copy into the repo; Code wires the cookie-consent banner gating GA4/Meta and verifies all 7 disclaimer placements. |
| 3.04 | Macedonian localization QA | Cowork + Code | Native Macedonian copy review and a symbol/shape cultural-clarity check (also readies the later languages). |
| 3.05 | Production cutover | Code + Cowork | Cowork: Hobby → Pro upgrade + the Cloudflare DNS record (DNS-only) for `iq.iqup.mk`; final cross-device QA on iOS Safari + Android Chrome; go live + a post-launch smoke test. |

---

## Critical path & dependencies

- **1.02 (Design) before 1.03 / 1.06 / 1.07** — the UI kit, flow screens, and report are all built against the Design handover, so the visual direction must be approved and handed over first.
- **1.04 + 1.05 before 1.06 / 1.07** — the flow and report need the task generators and the scoring/adaptive engine to exist.
- **Legal review (parallel track) must finish before 3.03** — it has a long lead time, so Cowork starts it early.
- **Brevo / Meta / GA4 access (parallel track) needed by Part 2** — all of Part 2's integration phases depend on the client supplying keys/IDs.
- **Supabase project (2.01) before the admin panel (2.04)** — admin auth and stats run on it.
- **Booking URL needed before launch** — the CTA isn't fully functional until the client provides it.
- **Vercel Pro (parallel) before 3.05** — the production cutover happens on Pro, not Hobby.

*Full per-layer scope and acceptance criteria: see `plan.md`. Decisions behind these phases: see `Decisions.md`.*
