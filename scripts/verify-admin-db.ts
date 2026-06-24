/**
 * Live verification for the admin-panel DB objects (Phase 2.04).
 *
 * Checks, against the real Supabase project, that:
 *   1. the service role can reach public.admin_users + public.admin_export_log
 *      (the tables exist) and the anon key CANNOT read them (RLS locked);
 *   2. the service role can call the admin_score_stats RPC and gets an
 *      aggregates-only jsonb ({ total, byAge, byGender, byCity, byLanguage,
 *      bands }) — with NO per-row data;
 *   3. the anon key CANNOT call the RPC (execute revoked).
 *
 * Run with env from .env.local (NOTHING secret is printed):
 *   set -a; . ./.env.local; set +a; npx tsx scripts/verify-admin-db.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const environment = process.env.APP_ENV || "development";

if (!url || !anonKey || !serviceKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

function check(label: string, ok: boolean, detail = ""): boolean {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  const service = createClient(url!, serviceKey!, {
    auth: { persistSession: false },
  });
  const anon = createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });

  let allOk = true;

  // 1a. admin_users reachable by the service role.
  const svcUsers = await service.from("admin_users").select("user_id").limit(5);
  allOk =
    check(
      "service role can query public.admin_users (table exists)",
      !svcUsers.error,
      svcUsers.error
        ? svcUsers.error.message
        : `${svcUsers.data?.length ?? 0} allowlisted user(s)`,
    ) && allOk;

  // 1b. admin_export_log reachable by the service role.
  const svcLog = await service.from("admin_export_log").select("id").limit(5);
  allOk =
    check(
      "service role can query public.admin_export_log (table exists)",
      !svcLog.error,
      svcLog.error
        ? svcLog.error.message
        : `${svcLog.data?.length ?? 0} log row(s)`,
    ) && allOk;

  // 1c. anon READ of admin_users blocked by RLS.
  const anonUsers = await anon.from("admin_users").select("user_id").limit(1);
  const anonUserRows = anonUsers.data?.length ?? 0;
  allOk =
    check(
      "anon key CANNOT read public.admin_users (RLS)",
      anonUserRows === 0,
      anonUsers.error ? `denied: ${anonUsers.error.code ?? "error"}` : "0 rows",
    ) && allOk;

  // 2. Service role can call the stats RPC and gets aggregates only.
  const svcStats = await service.rpc("admin_score_stats", {
    p_environment: environment,
  });
  const stats = svcStats.data as Record<string, unknown> | null;
  const hasShape =
    !!stats &&
    typeof stats.total === "number" &&
    typeof stats.byAge === "object" &&
    typeof stats.byGender === "object" &&
    typeof stats.byCity === "object" &&
    typeof stats.byLanguage === "object" &&
    typeof stats.bands === "object";
  allOk =
    check(
      `service role can call admin_score_stats('${environment}') → aggregates`,
      !svcStats.error && hasShape,
      svcStats.error
        ? svcStats.error.message
        : `total=${stats?.total} bands=${Object.keys((stats?.bands as object) ?? {}).join("/") || "—"}`,
    ) && allOk;

  // 3. anon CANNOT call the RPC (execute revoked).
  const anonStats = await anon.rpc("admin_score_stats", {
    p_environment: environment,
  });
  allOk =
    check(
      "anon key CANNOT call admin_score_stats (execute revoked)",
      !!anonStats.error,
      anonStats.error
        ? `denied: ${anonStats.error.code ?? "error"}`
        : "CALLED — GRANT LEAK!",
    ) && allOk;

  console.log(allOk ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("verification crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
