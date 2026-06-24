/**
 * POST /api/score — write ONE anonymous score row (spec §14.1).
 *
 * This is the only path to the `scores` table. It:
 *   1. validates the body with the strict `scoreRowSchema` — unknown/extra keys,
 *      PII (`email`/`phone`/`parentFirstName`), a lead id, and any client-supplied
 *      `created_date` / `created_at` / `environment` are REJECTED, not dropped;
 *   2. stamps `environment` server-side from `APP_ENV` (the client cannot set it);
 *   3. lets the DB stamp `created_date` (DATE only) and generate `id`;
 *   4. inserts via the service-role client (the only client that bypasses RLS).
 *
 * It NEVER logs PII (the row carries none, and we still avoid echoing the body).
 * Decoupled from the lead store: nothing here links a row to a parent.
 */

import { NextResponse } from "next/server";

import { scoreRowSchema } from "@/features/scoring/persist";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// A write — never cached / statically optimized.
export const dynamic = "force-dynamic";

const ALLOWED_ENVIRONMENTS = ["development", "preview", "production"] as const;
type Environment = (typeof ALLOWED_ENVIRONMENTS)[number];

/** Server-stamped environment (data hygiene). Defaults to development. */
function resolveEnvironment(): Environment {
  const value = process.env.APP_ENV;
  return (ALLOWED_ENVIRONMENTS as readonly string[]).includes(value ?? "")
    ? (value as Environment)
    : "development";
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Parse JSON (malformed → 400, no echo).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  // 2. Validate the row shape strictly. Do NOT log the payload or issue values.
  const parsed = scoreRowSchema.safeParse(body);
  if (!parsed.success) {
    // Field PATHS only (no values) — safe, and useful for debugging the client.
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(",");
    console.warn(`[/api/score] rejected payload (fields: ${fields || "—"})`);
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  // 3. Stamp environment server-side; the DB stamps created_date + id.
  const row = { ...parsed.data, environment: resolveEnvironment() };

  // 4. Insert via the service role (bypasses RLS). On failure, log a generic,
  //    PII-free message (the row has no PII) and return a minimal error.
  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("scores").insert(row);
    if (error) {
      console.error(`[/api/score] insert failed (code: ${error.code ?? "—"})`);
      return NextResponse.json(
        { ok: false, error: "write_failed" },
        { status: 500 },
      );
    }
  } catch {
    // Misconfiguration (missing env) or network error — never expose details.
    console.error("[/api/score] write error");
    return NextResponse.json(
      { ok: false, error: "write_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
