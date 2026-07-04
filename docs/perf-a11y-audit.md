# Performance + accessibility audit — reproduction steps

> Phase 3.02. This is the exact local reproduction so the same Lighthouse + axe
> run can be re-executed against the **real Vercel preview at 2.05** (that run
> is the true real-network / HTTPS-HSTS confirmation — this doc's numbers are a
> **local production build only**, per the 3.02 brief).

## 0. One-time setup

```bash
npm install   # pulls the pinned lighthouse / @axe-core/cli / chromedriver devDeps
```

`@axe-core/cli` drives a real Chrome via `chromedriver` + `selenium-webdriver`.
`chromedriver`'s version must match your installed Chrome's major version
exactly, or axe fails with `session not created: This version of ChromeDriver
only supports Chrome version N`. Check your Chrome version
(`chrome://version` or `Google Chrome --version`) and, if it doesn't match the
pinned `chromedriver` devDependency, install the matching one locally:

```bash
npm install --save-dev --save-exact chromedriver@<your-chrome-major>.0.x
```

(This is a local tooling pin, not a product dependency — re-pin it per machine
if needed; it does not affect the app.)

## 1. Build + serve

```bash
cp .env.local.example .env.local   # fill in real values, or use syntactically-
                                    # valid placeholders for a LOCAL-ONLY build
                                    # (see Decisions.md D-146 — no real network
                                    # calls happen during a static audit pass)
npm run build
npm run start -- -p 3010
```

Confirm the server is actually serving the **fresh** build before auditing —
if a stale `next start` process is still bound to the port from a previous
build, Lighthouse/axe will get real 500s for orphaned chunk hashes:

```bash
lsof -ti:3010 | xargs kill -9   # clear anything already bound to the port
npm run start -- -p 3010 &
sleep 4 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/   # expect 200
```

## 2. Lighthouse (Performance / Accessibility / Best Practices / SEO)

Routes gated by the DoD: `/`, `/procena`, `/za-testot`. Mobile is Lighthouse's
default preset (simulated Slow-4G + 4× CPU throttle) — no extra flags needed.
Desktop needs `--preset=desktop`.

```bash
# mobile (default preset) — repeat per route
npx lighthouse http://localhost:3010/ \
  --output=json --output-path=/tmp/lh-home.json \
  --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo --quiet

# desktop — add --preset=desktop
npx lighthouse http://localhost:3010/ --preset=desktop \
  --output=json --output-path=/tmp/lh-home-desktop.json \
  --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo --quiet
```

Local Lighthouse runs are noisy (±2–4 points, ±200–400ms LCP run-to-run on a
shared dev machine) — take the **median of 3 runs** per route/preset rather
than trusting a single run:

```bash
for run in 1 2 3; do
  npx lighthouse http://localhost:3010/procena \
    --output=json --output-path="/tmp/lh-procena-$run.json" \
    --chrome-flags="--headless=new" \
    --only-categories=performance,accessibility,best-practices,seo --quiet
done
```

Read scores out of the JSON:

```bash
python3 -c "
import json
d = json.load(open('/tmp/lh-home.json'))
for k, v in d['categories'].items(): print(k, v['score'])
au = d['audits']
for m in ['largest-contentful-paint','first-contentful-paint','speed-index','cumulative-layout-shift','total-blocking-time']:
    print(m, au[m]['displayValue'])
"
```

For LCP root-cause diagnosis (which element, what's blocking it), run without
`--only-categories` and read the Insight audits:

```bash
npx lighthouse http://localhost:3010/ --output=json --output-path=/tmp/lh-full.json \
  --chrome-flags="--headless=new" --quiet
python3 -c "
import json
d = json.load(open('/tmp/lh-full.json'))
au = d['audits']
for k in ['lcp-breakdown-insight','render-blocking-insight','network-dependency-tree-insight']:
    print(k, au[k]['score'])
"
```

## 3. axe-core (automated a11y)

Routes: `/`, `/za-testot`, `/admin/login`, `/procena` (setup screen — the rest
of the flow is stateful and covered by `/kit` + the manual pass below), `/kit`
(dev-only gallery — every component/state + every task renderer + the report
preview + lead-form/confirmation live on one page, per
`src/app/kit/kit-gallery.tsx`).

```bash
npx axe http://localhost:3010/ --dir /tmp/axe-out --save home.json
npx axe http://localhost:3010/za-testot --dir /tmp/axe-out --save zatestot.json
npx axe http://localhost:3010/admin/login --dir /tmp/axe-out --save adminlogin.json
npx axe http://localhost:3010/procena --dir /tmp/axe-out --save procena.json
npx axe http://localhost:3010/kit --dir /tmp/axe-out --save kit.json --timeout 120
```

Expect `0 violations found!` on every route. If not, the CLI prints the rule
id + a CSS selector for every failing node — cross-reference against
`src/lib/indices.ts` (index colors, duplicated from `globals.css` for
PDF-safety — **both must be edited together**, see the comment at the top of
that file) or the relevant component.

## 4. Contrast — reproducible computation

`scripts/check-contrast.ts` reads the hex tokens straight out of
`globals.css`'s `@theme` block and computes WCAG relative-luminance contrast
ratios for every `*-ink`-on-tint / `*-ink`-on-background / disabled pair — a
machine-checked replacement for eyeballing a contrast checker:

```bash
npx tsx scripts/check-contrast.ts
```

Exits non-zero if any non-exempt pair is below its WCAG floor. Note:
`src/lib/indices.ts` duplicates the same ink/soft hex values for
`@react-pdf`-safety (which cannot resolve CSS custom properties) — the script
only reads `globals.css`, so after changing an ink color also update the
matching `INDICES` entry in `indices.ts` and re-run the app's axe pass (which
DOES exercise the JS-side values via `band-label.tsx`'s inline styles) to
confirm both stayed in sync.

## 5. Manual WCAG 2.2 AA pass (keyboard / focus / reduced-motion)

No headless browser drives real Tab/Enter input reliably for a stateful SPA
flow, so this pass is a **code-level audit** cross-checked against the axe
results above (0 violations) rather than a recorded human click-through — the
real hands-on device pass is Phase 3.05. To repeat it:

- Grep every task renderer for `onClick` and confirm the element is a real
  `<button>` (native Enter/Space activation, no custom keydown re-implementation
  needed): `grep -rn "onClick" src/features/assessment/tasks/*.tsx`.
- Confirm no `tabIndex`, custom `onKeyDown` (beyond passive activity-tracking),
  `autoFocus`, or focus-trap logic exists outside `task-screen.tsx`'s
  `markActivity` (which never calls `preventDefault`/`stopPropagation`):
  `grep -rn "tabIndex\|onKeyDown\|autoFocus" src/features/assessment/tasks/ src/components/ui/`.
- Confirm `focus-visible:ring-[3px] focus-visible:ring-focus` is present on
  every interactive primitive (`button.tsx`, `answer-option.tsx`, `input.tsx`,
  `checkbox.tsx`, `select.tsx`).
- Confirm `<html lang="mk">` (`src/app/layout.tsx`) and heading order per page
  (no skipped levels) — axe's `heading-order` rule catches regressions here.
- Emulate `prefers-reduced-motion: reduce` in Chrome DevTools (Rendering tab →
  "Emulate CSS media feature prefers-reduced-motion") on `/kit`'s puzzle-brain
  section and confirm it snaps to the final frame instead of animating.

## 6. Bundle-size before/after

```bash
for route in / /procena /za-testot; do
  html=$(curl -s "http://localhost:3010${route}")
  scripts=$(echo "$html" | grep -oE 'src="/_next/static/[^"]+\.js"' | sed -E 's/src="(.*)"/\1/' | sort -u)
  total=0
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    sz=$(curl -s -o /dev/null -w "%{size_download}" "http://localhost:3010$s")
    total=$((total + sz))
  done <<< "$scripts"
  echo "$route: $total bytes"
done
```

## 7. Server-only leak check

Confirm no server-only module (Supabase service-role client, Brevo client,
`@react-pdf/renderer`, or secret env var names) ends up in a client chunk:

```bash
for pattern in "react-pdf" "supabase/server" "brevo/server" "SUPABASE_SERVICE_ROLE" "BREVO_API_KEY"; do
  echo "=== $pattern ==="
  grep -rl "$pattern" .next/static/chunks/*.js 2>/dev/null
done
```

Every command above should print nothing.

## Known local-environment ceiling (read before re-running at 2.05)

Local Lighthouse mobile runs (`throttlingMethod: simulate`, Lantern) model LCP
against `next start`'s plain HTTP/1.1 localhost server — no HTTP/2
multiplexing, no CDN edge, no real network. The simulated LCP therefore comes
in visibly higher (~2.9–3.3s) than the *observed* real timings in the same
report's `lcp-breakdown-insight` (which show low-single-digit-ms TTFB + a
~100ms element render delay), because Lantern extrapolates network/CPU cost
from the resource graph rather than measuring wall-clock. Best Practices /
Accessibility / SEO are unaffected by this and read 100 consistently; the
Performance/LCP numbers should be **re-measured on the real Vercel preview at
2.05** rather than trusted as the final gate from this local run alone — see
the completion report for the full explanation and current numbers.
