-- ============================================================================
-- Anonymous scores — "Store A" (spec §14.1)
-- ============================================================================
-- This is the ONLY place anonymous assessment results are persisted. It is the
-- first half of the spec's two-store privacy architecture:
--
--   Store A (this table)  — anonymous scores: coarse demographics + the 8 fine
--                           signals + the 5 parent-facing indices + validity +
--                           version stamps. Carries a DATE only (no time).
--   Store B (Brevo)       — the parent lead (first name, e-mail, phone, city).
--
-- The two stores must NEVER be joinable (spec §14.1):
--   * No shared surrogate key — `id` here is random and is never written to,
--     or derived from, anything in the lead store.
--   * DATE-ONLY, never a timestamp — `created_date` cannot be correlated with a
--     lead's exact creation time. There is deliberately NO `created_at` column.
--   * No PII lives here at all — no name, no e-mail, no phone, no child name.
--     (City + gender are coarse demographics the spec explicitly stores here;
--     they are low-cardinality and are NOT identifiers.)
--
-- RLS is enabled with NO policies, so anon / authenticated clients can neither
-- read nor write. Only the service-role key (which bypasses RLS) writes, and it
-- is used exclusively from server code (`src/lib/supabase/server.ts`). The
-- browser never touches this table directly — it POSTs to `/api/score`.
-- ============================================================================

create table if not exists public.scores (
  -- Surrogate PK. Random, never shared with the lead store (anti-join guarantee).
  id uuid primary key default gen_random_uuid(),

  -- DATE ONLY (no time). This is the anti-join guarantee — do NOT add a
  -- timestamp / created_at column. Stamped server-side by the DB default; the
  -- client may never supply it.
  created_date date not null default current_date,

  -- ── Coarse demographics (spec §14.1) — not identifying ──────────────────────
  age            smallint not null check (age between 5 and 13),
  child_gender   text     check (child_gender in ('male', 'female', 'undisclosed')),
  city           text     not null,
  language       text     not null default 'mk',

  -- ── The 8 fine signals, normed index 0–100 (spec §3.1 / §6.1) ───────────────
  -- gf=fluid reasoning, gv=visual-spatial, gsm=short-term memory, gs=processing
  -- speed, attention (derived), ef=executive function, glr=learning/retrieval,
  -- ct=computational thinking. (Live values are clamped to 8–99; the 0–100
  -- check is a deliberately generous data-quality bound.)
  gf         smallint not null check (gf        between 0 and 100),
  gv         smallint not null check (gv        between 0 and 100),
  gsm        smallint not null check (gsm       between 0 and 100),
  gs         smallint not null check (gs        between 0 and 100),
  attention  smallint not null check (attention between 0 and 100),
  ef         smallint not null check (ef        between 0 and 100),
  glr        smallint not null check (glr       between 0 and 100),
  ct         smallint not null check (ct        between 0 and 100),

  -- ── The 5 parent-facing composite indices, 0–100 (spec §6.3) ────────────────
  -- Column names are descriptive; they map from the app's IndexKey as:
  --   logic→logic, spatial→spatial, memory→memory_focus,
  --   planning→planning_speed, stem→learning_stem
  -- (the mapping is the single, tested constant INDEX_COLUMN in score-row.ts).
  logic          smallint not null check (logic          between 0 and 100),
  spatial        smallint not null check (spatial        between 0 and 100),
  memory_focus   smallint not null check (memory_focus   between 0 and 100),
  planning_speed smallint not null check (planning_speed between 0 and 100),
  learning_stem  smallint not null check (learning_stem  between 0 and 100),

  -- ── Per-index confidence (spec §6.5) — cheap, non-PII; supports §6.6 ────────
  conf_logic          text not null check (conf_logic          in ('high', 'medium', 'low')),
  conf_spatial        text not null check (conf_spatial        in ('high', 'medium', 'low')),
  conf_memory_focus   text not null check (conf_memory_focus   in ('high', 'medium', 'low')),
  conf_planning_speed text not null check (conf_planning_speed in ('high', 'medium', 'low')),
  conf_learning_stem  text not null check (conf_learning_stem  in ('high', 'medium', 'low')),

  -- ── Validity verdict (spec §7.1) — stored anonymously for data quality ──────
  validity_status text not null check (validity_status in ('ok', 'mild', 'strong')),

  -- ── Version stamps (spec §19.3–19.4 / §6.6) — keep results comparable ───────
  task_bank_version text not null,
  scoring_version   text not null,
  norms_version     text not null,
  -- seed-norms vs real-norms distinction (spec §6.6). Starts at 'seed'.
  norms_stage       text not null default 'seed' check (norms_stage in ('seed', 'real')),

  -- ── Data hygiene: lets preview/test rows be excluded from real norms later ──
  environment text not null default 'development'
              check (environment in ('development', 'preview', 'production'))
);

-- ── RLS: locked. Enabled with NO policies → anon/authenticated get nothing. ───
-- Only the service_role (bypasses RLS) writes, exclusively from server code.
alter table public.scores enable row level security;

-- ── Documenting comments ────────────────────────────────────────────────────
comment on table public.scores is
  'Anonymous assessment scores (Store A, spec §14.1). NO PII — no name/e-mail/'
  'phone/child name. DATE ONLY (created_date), never a timestamp, so rows cannot '
  'be correlated by time. The random id is never shared with the Brevo lead '
  'store: the two stores must never be joinable. RLS on, no policies — only the '
  'server-side service role writes; the browser POSTs to /api/score.';

comment on column public.scores.created_date is
  'Date only (no time) — the anti-join guarantee (spec §14.1). DB default; never client-supplied.';
comment on column public.scores.child_gender is
  'Coarse demographic (male/female/undisclosed), nullable. Not identifying.';
comment on column public.scores.validity_status is
  'Session validity verdict ok/mild/strong (spec §7.1), stored anonymously for data quality.';
comment on column public.scores.norms_stage is
  'seed = seed-norm reference values; real = recalibrated from collected data (spec §6.6).';
comment on column public.scores.environment is
  'development/preview/production — server-stamped so non-prod rows can be excluded from real norms.';
