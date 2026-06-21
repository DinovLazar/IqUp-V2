# IqUp-V2 — Agent Conventions

> Operating rules for any AI coding agent working in this repo. **`CLAUDE.md` is the full, authoritative version — read it first.** This file is a short mirror so a non-Claude agent still picks up the non-negotiables. Where this file and the live code disagree, the live code wins.

## The project

A free, mobile-first web app (lead magnet): an adaptive cognitive + STEM assessment for kids 5–13, **deterministic (no AI at run-time)**, Macedonian MVP. Next.js + TypeScript on Vercel. Product source of truth: `IQ_UP_Specifikacija_v1_2_FINAL.pdf`.

## How work flows

- Phase plans come from the project chat; you execute **one phase**, then write a completion report to `src/_project-state/completions/Part-X-Phase-YY-Completion.md` and update `current-state.md` + `file-map.md`.
- **One phase = one PR.** Branch `phase-X.YY-<slug>` (or `cowork/<slug>` for docs-only) off `main`. **Never merge your own PR — the human owner (Lazar) merges.** CodeRabbit reviews every PR; Codex on architectural ones.
- Public repo → **no secrets in code**; keys only in Vercel env, server-side.

## Non-negotiable product rules

- **No AI at run-time.** Deterministic, seedable engine — same answers → same result. Task bank / scoring / report templates are versioned; the version is saved per record.
- **No "clinical IQ"** — no exact number, no diagnosis, no ranking. Hybrid index display (pentagon + bar + word label + indicative range), never a hard number.
- **Two registers** — internal = technical; parent-facing = plain Macedonian, no jargon. To the child: encouragement only; "areas to grow," never deficits.
- **Privacy** — no child name; parent first name only. Anonymous scores and leads (Brevo) live in two stores that must **never be joinable**; the PDF is never stored; no PII in logs/analytics.
- **Accessibility** WCAG 2.2 AA; **Performance** Lighthouse 95+ and < 2.5s on 4G; no anxious timers except the speed game.
- **Disclaimer** "informative, not diagnostic" in all 7 placements.

Full detail, branch commands, and the end-of-phase ritual: see `CLAUDE.md`.

---
*IqUp-V2 | AGENTS.md | 2026-06-21*
