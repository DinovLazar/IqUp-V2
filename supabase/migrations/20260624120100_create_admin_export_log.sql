-- ============================================================================
-- Export audit log — public.admin_export_log (Phase 2.04, resolved decision 2)
-- ============================================================================
-- Every CSV export of contacts writes ONE row here, for GDPR traceability of the
-- single action that moves parent PII out of the system. The row records WHO
-- exported, WHAT kind of export, the FILTER summary, HOW MANY rows, and WHEN —
-- and deliberately NO parent contact data:
--
--   * actor_user_id — the Supabase Auth user id of the admin who exported.
--   * export_type   — 'all' | 'marketing_only'.
--   * filters       — a tiny jsonb summary { city, gender, marketing } (the
--                     filter VALUES the admin applied — these are admin-chosen
--                     query params, never a parent's actual contact record).
--   * row_count     — how many contacts the CSV contained.
--   * created_at    — when (a timestamp is fine: this table holds NO parent PII
--                     and shares NO key with public.scores, so it creates no
--                     join risk between Store A and Store B).
--
-- This table is NOT joinable to public.scores: it has its own random id and no
-- shared key, and it contains no anonymous-score data. It is NOT joinable to a
-- parent either: it stores no email / name / phone — only the admin actor and
-- aggregate counts.
--
-- RLS is ENABLED with NO policies — only the service-role key (server code)
-- writes it. Mirrors public.scores / public.admin_users.
-- ============================================================================

create table if not exists public.admin_export_log (
  -- Random surrogate PK — shared with nothing.
  id uuid primary key default gen_random_uuid(),

  -- The admin who exported. References auth.users; kept even if filters change.
  actor_user_id uuid not null references auth.users (id) on delete set null,

  -- What kind of export ran.
  export_type text not null check (export_type in ('all', 'marketing_only')),

  -- Small filter summary the admin applied: { city, gender, marketing }. Admin
  -- query params only — NOT a parent's contact record. Defaults to {}.
  filters jsonb not null default '{}'::jsonb,

  -- How many contacts the CSV contained.
  row_count integer not null default 0 check (row_count >= 0),

  -- When (timestamp is safe — no PII, no shared key with public.scores).
  created_at timestamptz not null default now()
);

-- RLS: locked. Enabled with NO policies → anon / authenticated get nothing.
alter table public.admin_export_log enable row level security;

comment on table public.admin_export_log is
  'PII-free export audit log (Phase 2.04, decision 2). One row per CSV export: '
  'actor user_id + export_type + filter summary + row_count + timestamp. NO '
  'parent contact data (no email/name/phone). Not joinable to public.scores '
  '(no shared key). RLS on, no policies — only the server-side service role writes.';
comment on column public.admin_export_log.filters is
  'Admin-applied filter summary { city, gender, marketing } — query params, not parent PII.';
