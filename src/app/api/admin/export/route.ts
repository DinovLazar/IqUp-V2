/**
 * GET /api/admin/export — download contacts as CSV (Phase 2.04, spec §15).
 *
 * Auth-gated by `requireAdmin()` (session + aal2 + allowlist) — an unauthenticated
 * or non-admin request gets 401 and NO data. It reads the env-resolved Brevo list
 * live, applies the SAME filters as the contacts page (`?city=&gender=&marketing=`),
 * and streams a CSV of the displayed fields only (no age, no results).
 *
 * `?marketing=yes` (or `only`) restricts to consentMarketing === true — the
 * marketing-consent-only variant (export_type = "marketing_only").
 *
 * Every export writes ONE PII-free `public.admin_export_log` row (decision 2)
 * BEFORE returning the file. The audit write is FAIL-CLOSED: if it cannot be
 * recorded, the export is refused (500) rather than letting PII leave the system
 * untraced. This route reads ONLY Brevo contacts + writes ONLY the audit row; it
 * never reads the scores store (the unjoinable invariant).
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/admin-guard";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  fetchAllContactsFromList,
  resolveBrevoListId,
} from "@/lib/brevo/server";
import {
  buildExportAuditRow,
  CSV_BOM,
  exportTypeFor,
  filterContacts,
  parseContactFilters,
  toContactsCsv,
} from "@/features/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Today as YYYY-MM-DD for the (un-stored) download filename. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request): Promise<Response> {
  // 1. Auth boundary — 401 on any failure (no redirect for an API route).
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  // 2. Filters from the query string (server-side; the Brevo key stays server-side).
  const url = new URL(request.url);
  const filters = parseContactFilters(Object.fromEntries(url.searchParams));

  // 3. Read the env-resolved list live + filter.
  const listId = resolveBrevoListId();
  const { contacts } = await fetchAllContactsFromList({ listId });
  const rows = filterContacts(contacts, filters);

  // 4. Audit BEFORE handing out PII (fail-closed — no untraced PII export).
  const auditRow = buildExportAuditRow({
    actorUserId: guard.userId,
    filters,
    rowCount: rows.length,
  });
  const service = getServiceRoleClient();
  const { error: auditError } = await service
    .from("admin_export_log")
    .insert(auditRow);
  if (auditError) {
    console.error(`[/api/admin/export] audit write failed: ${auditError.code}`);
    return NextResponse.json(
      { ok: false, error: "audit_failed" },
      { status: 500 },
    );
  }

  // 5. Stream the CSV (BOM so Excel reads Cyrillic).
  const csv = CSV_BOM + toContactsCsv(rows);
  const variant =
    exportTypeFor(filters) === "marketing_only" ? "-marketing" : "";
  const filename = `iqup-contacts${variant}-${today()}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
