# Part 2 · Phase 02 — Brevo setup (account, sender domain, lists, attributes, API key) · Completion Report

**Phase:** Part 2 · Phase 02 — Cowork: stand up Brevo (email + contact platform)
**Executing Claude:** Cowork
**Date completed:** 2026-06-24
**Branch:** `main` (no code branch — infra/credentials only; nothing committed by this phase)
**Commits:** none for `.env.local` (gitignored, must never be committed). This report is the only file Code should commit.
**PR:** n/a

## What shipped

- Confirmed/used the existing Brevo account (workspace **"iqup"**), owned by **dinovlazar2011@gmail.com**, on the **Free plan**, EU data region. (An account already existed for this project — no duplicate was created.)
- Added **`iqup.mk`** as a sending domain in Brevo and started authentication; captured the **exact DKIM/DMARC/Brevo-code DNS records**. **DNS for `iqup.mk` is client-controlled (Cloudflare)** — records are documented below and handed off; **the phase is flagged blocked-on-client-DNS** for the domain-authentication / `noreply@iqup.mk` parts.
- Created the two contact lists with the exact required names: **`IqUp-V2 — Leads (Production)` = list ID `7`** and **`IqUp-V2 — Leads (Test)` = list ID `8`**.
- Created all **8 custom contact attributes** with the exact names/types the Code half writes to.
- Created the transactional API key **`IqUp-V2 server`** (Active) and placed it + the non-secret Brevo config into the gitignored **`.env.local`** (key value deliberately **not** recorded here).
- Proved the **API key + transactional pipeline work**: a live transactional send from the **verified** sender was **Delivered**; the send attempted from `noreply@iqup.mk` was **rejected** ("sender is not valid") — exactly because the domain isn't authenticated yet.

## Account facts (non-secret)

- **Provider:** Brevo (formerly Sendinblue) — EU-hosted (GDPR; Brevo stores customer data in the EU by default).
- **Workspace / account name:** `iqup`
- **Owner login:** dinovlazar2011@gmail.com
- **Plan:** Free (300 emails/day).
- **App URL:** https://app.brevo.com
- **Ownership/billing transfer to the client (data controller):** NOT done — flagged as a launch carryover (see below).

## Sender status

- **Production sender (the one the app uses): `noreply@iqup.mk` — NOT yet usable.** It is rejected by Brevo until `iqup.mk` is authenticated. Live test confirmed the rejection: *"Sending has been rejected because the sender you used noreply@iqup.mk is not valid."* This unblocks the moment the client adds the DNS records below and Brevo shows the domain **Authenticated**.
- **Verified sender that exists today:** `iqup <dinovlazar2011@gmail.com>` — shows **Verified** (green). Used only to prove the pipeline; it is a freemail (gmail) address Brevo flags as not recommended for production, so it is **not** the app's sender.
- **Reply-to:** not set (no monitored client inbox provided yet) — carryover.

## Contact lists (record these — the Code half uses the numeric IDs)

| List name (exact) | List ID |
|---|---|
| `IqUp-V2 — Leads (Production)` | **7** |
| `IqUp-V2 — Leads (Test)` | **8** |

*(Pre-existing unrelated lists `#2`–`#5` were left untouched.)*

## Custom contact attributes (all created; exact names + types)

| Attribute | Type | Origin |
|---|---|---|
| `PHONE` | Text | Custom |
| `CITY` | Text | Custom |
| `CHILD_GENDER` | Text | Custom |
| `LANGUAGE` | Text | Custom |
| `CONSENT_SERVICE` | Boolean | Custom |
| `CONSENT_PARENT` | Boolean | Custom |
| `CONSENT_MARKETING` | Boolean | Custom |
| `CONSENT_DATE` | Date | Custom |

`FIRSTNAME` and `EMAIL` are Brevo built-ins — not recreated. (Attribute count went 21 → 29, i.e. exactly +8.)

## `.env.local` — variable NAMES added (values never recorded here)

Appended to the existing gitignored `/.env.local` (alongside the 2.01 Supabase vars):

```
BREVO_API_KEY=…            # SECRET — server-only; lives only in .env.local; never committed, never in this report
BREVO_SENDER_EMAIL=noreply@iqup.mk
BREVO_SENDER_NAME="IQ UP!"   # quoted so `set -a; . ./.env.local` doesn't choke on the space
BREVO_LIST_ID_PRODUCTION=7
BREVO_LIST_ID_TEST=8
```

- **API key name in Brevo:** `IqUp-V2 server` (Active; created 2026-06-24; default expiry **2027-06-24**; Brevo also auto-expires keys after **90 days of inactivity**).
- Verified gitignored & untracked: `git check-ignore -v .env.local` → matched by `.gitignore:38:.env*`; `git ls-files .env.local` → empty; `git status` shows no env files. ✓

## DNS records to add to the `iqup.mk` Cloudflare zone (HAND TO CLIENT)

Set Cloudflare proxy to **DNS-only (grey cloud)** for these. `iqup.mk` is added to Brevo in **pending** state; once these are live the client (or we) clicks **Authenticate this email domain** in Brevo.

| # | Type | Name / Host | Value |
|---|---|---|---|
| 1 | TXT | `@` (or `iqup.mk`) | `brevo-code:5d77255336cc6077e70e44580c4f84b0` |
| 2 | CNAME | `brevo1._domainkey` | `b1.iqup-mk.dkim.brevo.com` |
| 3 | CNAME | `brevo2._domainkey` | `b2.iqup-mk.dkim.brevo.com` |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:noreply@iqup.mk` |

Notes:
- Record #4 (DMARC) only if no `_dmarc.iqup.mk` record already exists. Brevo's own suggested DMARC value is `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` (routes aggregate reports to Brevo's dashboard) — either is a valid `p=none` policy; the brief specified the `noreply@iqup.mk` form, used above.
- **No separate SPF record** was provided by Brevo's current flow — Brevo authenticates via the two DKIM CNAMEs + the Brevo-code TXT (DKIM-based), so SPF is not required for the domain to show **Authenticated**. (This differs from the brief's "DKIM/SPF" wording — see Surprises.)

## Test evidence (Transactional → Logs, 2026-06-24 05:48)

Two live transactional sends were triggered via Brevo's `/v3/smtp/email` API using the new key (both returned HTTP 201 + a messageId, proving the key authenticates):

- **From verified `dinovlazar2011@gmail.com` → `dinovlazar2011@gmail.com`:** event = **Delivered** ✓ (messageId `<202606240348.12160179758@smtp-relay.mailin.fr>`). Proves key + transactional pipeline + inbox delivery.
- **From `noreply@iqup.mk` → `dinovlazar2011@gmail.com`:** event = **Error** ✗ (messageId `<202606240348.66559255732@smtp-relay.mailin.fr>`) — *"Sending has been rejected because the sender you used noreply@iqup.mk is not valid."* Confirms `noreply@iqup.mk` is blocked until the domain is authenticated.

*(The session harness does not persist browser screenshots to disk, so evidence is recorded textually here; statuses are visible live in Brevo → Transactional → Email → Logs.)*

## Decisions made on the fly

1. **Reused the existing "iqup" Brevo account** instead of creating a fresh one — it already exists under the exact owner email the brief named (dinovlazar2011@gmail.com), on Free/EU. Creating a duplicate would have split config. 
2. **Created two brand-new lists (`#7`, `#8`) with the exact brief names** rather than repurposing the older `IqUp Leads (All)` (`#3`) / `IqUp Marketing (Nurture)` (`#4`) lists — the Code half's contract is the exact names/IDs, and the IDs are what matters.
3. **Proved the pipeline from the verified gmail sender** (Delivered) since `noreply@iqup.mk` cannot send until DNS — this still satisfies "prove the key + transactional sending work," with the `noreply@` inbox-proof explicitly deferred to client DNS.
4. **Quoted `BREVO_SENDER_NAME="IQ UP!"`** in `.env.local` so the repo's `set -a; . ./.env.local` tooling (used by the 2.01 verify script) doesn't break on the space. Next.js/dotenv reads it identically.
5. **Left the API key at default 1-year expiry** — noted the 90-day-inactivity auto-expiry as a carryover so it gets exercised/rotated before launch.

## Surprises / off-spec changes

- **No SPF record in Brevo's authentication flow.** Brevo now authenticates with Brevo-code TXT + two DKIM CNAMEs (+ optional DMARC); there is no SPF include to add for the domain to authenticate. The brief said "DKIM/SPF" — treat the DKIM CNAMEs as the authentication records.
- **The account/lists pre-existed** from earlier setup (lists `#2`–`#5`, two older API keys `iqup-web*`). Nothing existing was modified or deleted.
- **Brevo accepted the `noreply@` API call (HTTP 201) but then errored at send** — acceptance ≠ deliverability; the rejection only shows in the logs, not the API response.

## Files written / updated

**New:**
- `src/_project-state/completions/Part-2-Phase-02-Cowork-Completion.md` — this report.

**Modified:**
- `/.env.local` — appended the 5 `BREVO_*` variables (gitignored; real values incl. the secret key; NOT committed).

## Blocked / carryover

- [ ] **`iqup.mk` domain authentication is BLOCKED on client DNS access.** The 4 records above must be added to the `iqup.mk` Cloudflare zone (DNS-only), then Brevo clicked to **Authenticate**. **Until then the app cannot send the report email** — production sends from `noreply@iqup.mk` will error exactly as the test showed.
- [ ] **Add the 5 `BREVO_*` vars to Vercel's environment at Phase 2.05.**
- [ ] **Move Brevo account ownership/billing to the client** (the data controller) before launch.
- [ ] **Set a real `reply-to`** once the client provides a monitored inbox (currently unset).
- [ ] **API key expiry:** default expiry 2027-06-24 + 90-day-inactivity rule — rotate/exercise before launch.
- [ ] **(Minor) Production sender is freemail-flagged only as a fallback** — the real sender `noreply@iqup.mk` becomes valid once the domain authenticates; do not ship with the gmail sender.

## What's next

**Part 2 · Phase 02 (Code half):** wire the app to Brevo using the now-populated `.env.local` — on lead submit, upsert the parent as a Brevo contact (built-ins `EMAIL`/`FIRSTNAME` + the 8 custom attributes above) onto list **7** (prod) / **8** (test), and send the transactional report-PDF email from `BREVO_SENDER_EMAIL` via `/v3/smtp/email` (reusing 1.09's `renderReportPdf`). Code can build and test against everything here now; **real outbound mail from `noreply@iqup.mk` only works after the client adds the DNS records.**

---
*IqUp-V2 | Part 2 · Phase 02 Cowork Completion | 2026-06-24*
