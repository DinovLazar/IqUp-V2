# AI code review — one-time setup (CodeRabbit + Codex)

Every pull request gets an automated sanity check before Lazar merges. The
in-repo config (`.coderabbit.yaml`) is already committed, so CodeRabbit works
the moment the app is connected. These two steps are **browser-only** — they
can't be done from the terminal. **Owner: Cowork** (hand to Lazar to click
through). ~5 minutes total, one time for the whole project.

## 1. CodeRabbit — auto-reviews every PR (~3 min)

1. Go to <https://coderabbit.ai> and **Sign in with GitHub** (use the
   `DinovLazar` account).
2. Authorize CodeRabbit and **install it on the `DinovLazar/IqUp-V2`
   repository** (you can grant it just this repo).
3. Done. On the next PR, CodeRabbit posts an inline review within ~2 minutes.
   It reads `.coderabbit.yaml` automatically — no extra config.

## 2. Codex — deeper review on architectural PRs (~30s per PR)

Codex (OpenAI) is used **selectively**, on architectural PRs (migrations,
cross-module flows, new integrations, the scoring/report engines) — not every
PR.

1. Make sure the **Codex / ChatGPT GitHub connector** is connected to the
   `DinovLazar` GitHub account (one-time, at <https://chatgpt.com> → Settings →
   Connectors / GitHub, or via the Codex app).
2. To request a review on a specific PR, mention/assign Codex on that PR (e.g.
   `@codex review`) or open it from the Codex interface against the branch.

## How review fits the workflow

1. Open a PR. Wait ~2 min for CodeRabbit's inline review.
2. For architectural PRs, also request a Codex review.
3. Address must-fix items with new commits on the same branch.
4. **Lazar merges** once must-fix items are resolved (nobody merges their own
   PR). Skip AI review only for `cowork/*` PRs with no code.

> Status: as of Phase 1.01 these apps are **not yet confirmed connected** to
> the `DinovLazar` account. This runbook is the hand-off to do it. The repo and
> its config are ready regardless.
