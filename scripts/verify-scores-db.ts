/**
 * Live verification for the anonymous scores DB (Phase 2.01).
 *
 * Checks, against the real Supabase project, that:
 *   1. the service role can reach `public.scores` (the table exists);
 *   2. the ANON key can neither READ nor WRITE it (RLS is locked);
 *   3. the latest row (if any) is shaped correctly — DATE-ONLY `created_date`,
 *      version stamps present, `environment` set, and NO PII column exists.
 *
 * Run with env from .env.local (NOTHING secret is printed):
 *   set -a; . ./.env.local; set +a; npx tsx scripts/verify-scores-db.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const PII_TOKENS = [
  "email",
  "phone",
  "name",
  "first",
  "surname",
  "lead",
  "consent",
  "created_at",
  "timestamp",
  "ip",
];

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

  // 1. Table exists / reachable by the service role.
  const svc = await service
    .from("scores")
    .select("*")
    .order("created_date", { ascending: false })
    .limit(5);
  allOk =
    check(
      "service role can query public.scores (table exists)",
      !svc.error,
      svc.error ? svc.error.message : `${svc.data?.length ?? 0} recent row(s)`,
    ) && allOk;

  // 2a. Anon READ is blocked by RLS (empty result OR error — never rows).
  const anonRead = await anon.from("scores").select("*").limit(1);
  const anonRows = anonRead.data?.length ?? 0;
  allOk =
    check(
      "anon key CANNOT read rows (RLS)",
      anonRows === 0,
      anonRead.error ? `denied: ${anonRead.error.code ?? "error"}` : "0 rows",
    ) && allOk;

  // 2b. Anon WRITE is blocked by RLS.
  const anonWrite = await anon.from("scores").insert({
    age: 9,
    city: "X",
    language: "mk",
    gf: 50,
    gv: 50,
    gsm: 50,
    gs: 50,
    attention: 50,
    ef: 50,
    glr: 50,
    ct: 50,
    logic: 50,
    spatial: 50,
    memory_focus: 50,
    planning_speed: 50,
    learning_stem: 50,
    conf_logic: "high",
    conf_spatial: "high",
    conf_memory_focus: "high",
    conf_planning_speed: "high",
    conf_learning_stem: "high",
    validity_status: "ok",
    task_bank_version: "x",
    scoring_version: "x",
    norms_version: "x",
  });
  allOk =
    check(
      "anon key CANNOT insert (RLS)",
      !!anonWrite.error,
      anonWrite.error
        ? `denied: ${anonWrite.error.code ?? "error"}`
        : "INSERTED — RLS LEAK!",
    ) && allOk;

  // 3. Audit the latest row's shape (if any rows exist yet).
  const latest = svc.data?.[0] as Record<string, unknown> | undefined;
  if (!latest) {
    console.log(
      "• no rows yet — run the e2e write, then re-run to audit shape",
    );
  } else {
    const keys = Object.keys(latest);
    const piiKeys = keys.filter((k) =>
      PII_TOKENS.some((t) => k.toLowerCase().includes(t)),
    );
    allOk =
      check(
        "latest row carries NO PII column",
        piiKeys.length === 0,
        piiKeys.length
          ? `found: ${piiKeys.join(",")}`
          : `${keys.length} columns`,
      ) && allOk;

    const createdDate = String(latest.created_date ?? "");
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(createdDate);
    allOk =
      check(
        "created_date is DATE-ONLY (no time component)",
        dateOnly,
        createdDate,
      ) && allOk;

    allOk =
      check(
        "version stamps + norms_stage present",
        !!latest.task_bank_version &&
          !!latest.scoring_version &&
          !!latest.norms_version &&
          !!latest.norms_stage,
        `tb=${latest.task_bank_version} sc=${latest.scoring_version} nv=${latest.norms_version} stage=${latest.norms_stage}`,
      ) && allOk;

    allOk =
      check(
        "environment stamped",
        typeof latest.environment === "string" && latest.environment.length > 0,
        String(latest.environment),
      ) && allOk;
  }

  console.log(allOk ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("verification crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
