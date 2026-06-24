-- ============================================================================
-- Admin stats RPC — public.admin_score_stats(p_environment) (Phase 2.04, §15)
-- ============================================================================
-- The stats page (/admin) shows AGGREGATES of the anonymous public.scores store
-- (Store A) only. To honour "only aggregates cross the boundary — never per-row
-- identity" (spec §15 / brief Task 5), the aggregation is done IN Postgres and
-- the function returns a single JSON blob of counts. No per-row data leaves the
-- database; the page only ever receives totals + distributions.
--
-- It is filtered to ONE environment (the server passes the env-resolved value,
-- matching scores.environment), so production stats never mix with preview/test.
--
-- SECURITY: execute is REVOKED from public/anon/authenticated and GRANTed only
-- to service_role. The admin pages call it exclusively through the server-only
-- service-role client (which bypasses RLS), so the anon key can never invoke it
-- and per-row scores never reach the browser. (public.scores has RLS on / no
-- policies; service_role bypasses RLS, so this security-invoker function reads it
-- when — and only when — called by the service role.)
--
-- Band cut-offs live in the helper public.score_band(value) and MUST equal the
-- app's BAND_THRESHOLDS (seed-norms §6.4: exceptional ≥ 80, strong ≥ 64,
-- solid ≥ 45, else development). A code↔SQL parity test guards the values.
-- ============================================================================

-- Single source of the band cut-offs in SQL. IMMUTABLE + schema-qualified so it
-- is safe under an empty search_path.
create or replace function public.score_band(value integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when value >= 80 then 'exceptional'
    when value >= 64 then 'strong'
    when value >= 45 then 'solid'
    else 'development'
  end
$$;

comment on function public.score_band(integer) is
  'Maps a 0-100 index value to a parent-facing band word. Cut-offs MUST equal the '
  'app BAND_THRESHOLDS (seed-norms §6.4): exceptional>=80, strong>=64, solid>=45, '
  'else development. Guarded by a code<->SQL parity test (Phase 2.04).';

-- Returns ALL admin stats for one environment as a single jsonb document.
-- security invoker (the default for language sql): runs with the caller's
-- privileges, so only the RLS-bypassing service_role can actually read scores.
create or replace function public.admin_score_stats(p_environment text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with rows as (
    select * from public.scores where environment = p_environment
  ),
  -- one (index_key, band) row per scored index, unpivoted, so band counts share
  -- the exact same public.score_band() helper for all five indices.
  banded as (
    select 'logic' as index_key, public.score_band(logic) as band from rows
    union all
    select 'spatial', public.score_band(spatial) from rows
    union all
    select 'memory', public.score_band(memory_focus) from rows
    union all
    select 'planning', public.score_band(planning_speed) from rows
    union all
    select 'stem', public.score_band(learning_stem) from rows
  )
  select jsonb_build_object(
    'total', (select count(*) from rows),
    'byAge', coalesce(
      (select jsonb_object_agg(age::text, c)
         from (select age, count(*) c from rows group by age) s), '{}'::jsonb),
    'byGender', coalesce(
      (select jsonb_object_agg(g, c)
         from (select coalesce(child_gender, 'unknown') g, count(*) c
                 from rows group by 1) s), '{}'::jsonb),
    'byCity', coalesce(
      (select jsonb_object_agg(city, c)
         from (select city, count(*) c from rows group by city) s), '{}'::jsonb),
    'byLanguage', coalesce(
      (select jsonb_object_agg(language, c)
         from (select language, count(*) c from rows group by language) s), '{}'::jsonb),
    'bands', coalesce(
      (select jsonb_object_agg(index_key, band_counts)
         from (select index_key,
                      jsonb_object_agg(band, c) as band_counts
                 from (select index_key, band, count(*) c
                         from banded group by index_key, band) b
                group by index_key) idx), '{}'::jsonb)
  );
$$;

comment on function public.admin_score_stats(text) is
  'Aggregates-only stats over public.scores for ONE environment (Phase 2.04). '
  'Returns { total, byAge, byGender, byCity, byLanguage, bands } as jsonb — no '
  'per-row data crosses the boundary. Execute granted ONLY to service_role.';

-- Lock execution down to the server-only service role.
revoke all on function public.score_band(integer) from public;
revoke all on function public.admin_score_stats(text) from public;
grant execute on function public.admin_score_stats(text) to service_role;
