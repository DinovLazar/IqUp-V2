-- ============================================================================
-- Admin allowlist — public.admin_users (Phase 2.04, spec §15)
-- ============================================================================
-- The positive allowlist that, together with a valid session AT assurance level
-- aal2 (TOTP MFA satisfied), grants access to the admin panel. The server-side
-- `requireAdmin()` guard reads this table via the service-role client and treats
-- ONLY rows present here as admins.
--
-- Why a positive allowlist (not just "any authenticated user"): public sign-ups
-- are disabled in the Supabase dashboard, but the allowlist is the backstop — if
-- sign-ups are ever re-enabled by mistake, the panel does NOT silently open. A
-- new admin is created in the Supabase dashboard (email/password) and their
-- auth `user_id` (UUID) is inserted here by hand. There is no in-app user
-- management for the MVP (resolved decision 4).
--
-- RLS is ENABLED with NO policies, so `anon` / `authenticated` clients can
-- neither read nor write — only the service-role key (which bypasses RLS, used
-- exclusively from server code) reads it. This mirrors public.scores (2.01).
-- ============================================================================

create table if not exists public.admin_users (
  -- The Supabase Auth user id. We reference auth.users so deleting the auth user
  -- removes the allowlist row too (no dangling admin). ON DELETE CASCADE.
  user_id uuid primary key references auth.users (id) on delete cascade,

  -- Optional human label (e.g. "Lazar — owner"). NOT a credential, NOT PII of a
  -- lead — internal staff annotation only.
  label text,

  created_at timestamptz not null default now()
);

-- RLS: locked. Enabled with NO policies → anon / authenticated get nothing.
-- Only the service_role (bypasses RLS) reads it, from server code only.
alter table public.admin_users enable row level security;

comment on table public.admin_users is
  'Admin allowlist (Phase 2.04, spec §15). A user_id present here + a valid aal2 '
  'session = admin. Positive allowlist backstops disabled public sign-ups. RLS '
  'on, no policies — only the server-side service role reads it. No lead PII.';
comment on column public.admin_users.label is
  'Optional internal staff label (e.g. "Lazar — owner"). Not a credential, not lead PII.';
