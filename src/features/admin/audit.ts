/**
 * Export audit row — pure builder for the `public.admin_export_log` insert
 * (Phase 2.04, resolved decision 2). The row records WHO exported, WHAT kind,
 * the FILTER summary, and HOW MANY rows — and deliberately NO parent contact
 * data (no email / name / phone). A test asserts the shape is PII-free.
 *
 * `filters` carries the admin-chosen query-param VALUES (city/gender/marketing),
 * which are not a parent's record; they're what the admin typed into the filter
 * bar. `created_at` is the DB default (safe — this table holds no PII and shares
 * no key with public.scores, so it creates no Store-A/Store-B join risk).
 */

import { exportTypeFor, type ContactFilters } from "./contacts";

export interface ExportAuditRow {
  actor_user_id: string;
  export_type: "all" | "marketing_only";
  filters: {
    city: string | null;
    gender: string | null;
    marketing: string | null;
  };
  row_count: number;
}

/** The only keys an audit row may carry — anchors the PII-free guard test. */
export const EXPORT_AUDIT_KEYS = [
  "actor_user_id",
  "export_type",
  "filters",
  "row_count",
] as const satisfies readonly (keyof ExportAuditRow)[];

export function buildExportAuditRow(input: {
  actorUserId: string;
  filters: ContactFilters;
  rowCount: number;
}): ExportAuditRow {
  return {
    actor_user_id: input.actorUserId,
    export_type: exportTypeFor(input.filters),
    filters: {
      city: input.filters.city ?? null,
      gender: input.filters.gender ?? null,
      marketing: input.filters.marketing ?? null,
    },
    row_count: input.rowCount,
  };
}
