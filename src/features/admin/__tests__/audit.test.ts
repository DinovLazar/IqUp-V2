/**
 * Export audit row (Phase 2.04, decision 2): the row is PII-FREE — it carries the
 * actor + export type + filter summary + count, and NO parent contact field.
 */

import { describe, expect, it } from "vitest";

import { buildExportAuditRow, EXPORT_AUDIT_KEYS } from "../audit";

describe("buildExportAuditRow", () => {
  it("maps the actor, type, filters and count", () => {
    const row = buildExportAuditRow({
      actorUserId: "user-123",
      filters: { city: "Скопје", gender: "female", marketing: "yes" },
      rowCount: 42,
    });
    expect(row).toEqual({
      actor_user_id: "user-123",
      export_type: "marketing_only",
      filters: { city: "Скопје", gender: "female", marketing: "yes" },
      row_count: 42,
    });
  });

  it("defaults missing filters to null and type to all", () => {
    const row = buildExportAuditRow({
      actorUserId: "u",
      filters: {},
      rowCount: 0,
    });
    expect(row.export_type).toBe("all");
    expect(row.filters).toEqual({ city: null, gender: null, marketing: null });
  });

  it("contains NO parent contact field (PII-free)", () => {
    const row = buildExportAuditRow({
      actorUserId: "u",
      filters: { city: "Скопје" },
      rowCount: 1,
    });

    // Top-level keys are exactly the audit keys (no email/name/phone/etc.).
    expect(Object.keys(row).sort()).toEqual([...EXPORT_AUDIT_KEYS].sort());

    // A deep scan of all stringified content holds no PII tokens.
    const blob = JSON.stringify(row).toLowerCase();
    for (const token of [
      "email",
      "firstname",
      "phone",
      "@",
      "consentservice",
      "signup",
    ]) {
      expect(blob).not.toContain(token);
    }
  });
});
