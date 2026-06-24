/**
 * Public barrel for the pure admin core (Phase 2.04). No network, no React —
 * the page, the export route, and the tests import from here. The server-only
 * Brevo fetch + mapping lives in `src/lib/brevo/server.ts`; the auth guard in
 * `src/lib/supabase/admin-guard.ts`.
 */

export {
  ADMIN_CONTACT_KEYS,
  CONTACTS_PAGE_SIZE,
  exportTypeFor,
  filterContacts,
  paginate,
  parseContactFilters,
  type AdminContact,
  type ContactFilters,
  type MarketingFilter,
  type Page,
} from "./contacts";

export { CSV_BOM, CSV_HEADERS, escapeCsvField, toContactsCsv } from "./csv";

export {
  normalizeStats,
  sortedEntries,
  sortedNumericEntries,
  type AdminStats,
  type Distribution,
} from "./stats";

export {
  buildExportAuditRow,
  EXPORT_AUDIT_KEYS,
  type ExportAuditRow,
} from "./audit";
