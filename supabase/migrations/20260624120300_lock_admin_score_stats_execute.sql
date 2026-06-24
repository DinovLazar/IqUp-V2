-- ============================================================================
-- Lock admin_score_stats / score_band execute to service_role (Phase 2.04)
-- ============================================================================
-- Supabase grants a DEFAULT execute privilege on new public-schema functions to
-- the `anon` and `authenticated` roles (via ALTER DEFAULT PRIVILEGES), which the
-- `revoke ... from public` in 20260624120200 does NOT remove. Revoke those
-- explicit grants too, so admin_score_stats can be invoked ONLY by service_role
-- (the server-only client), matching the brief ("execute granted ONLY to
-- service_role").
--
-- NOTE: this was always defence-in-depth, never a data leak — admin_score_stats
-- is `security invoker`, so an anon caller runs as `anon`, hits RLS on
-- public.scores (enabled, no policies), reads 0 rows, and gets empty aggregates.
-- Locking execute removes even the ability to call it.
-- ============================================================================

revoke all on function public.admin_score_stats(text) from anon, authenticated;
revoke all on function public.score_band(integer) from anon, authenticated, public;

-- Re-assert the only intended grant (idempotent).
grant execute on function public.admin_score_stats(text) to service_role;
