/**
 * Pure CSV serialization for the contacts export (Phase 2.04). No IO: the route
 * handler builds the HTTP response (Content-Type / Content-Disposition) around
 * this string and prepends `CSV_BOM`. The columns are EXACTLY the displayed
 * contact fields — no age, no results (the unjoinable invariant, decision 1).
 *
 * Booleans render as "true"/"false" (unambiguous for re-import + analysis);
 * fields are RFC-4180 escaped (quote-wrapped + doubled quotes when they contain
 * a comma, quote, CR or LF).
 */

import { ADMIN_CONTACT_KEYS, type AdminContact } from "./contacts";

/** UTF-8 BOM so Excel reads Cyrillic correctly. Prepended by the route, not here. */
export const CSV_BOM = "﻿";

/** Stable, human-readable MK column headers, one per ADMIN_CONTACT_KEYS entry. */
export const CSV_HEADERS: Record<(typeof ADMIN_CONTACT_KEYS)[number], string> =
  {
    firstName: "Име",
    email: "Е-пошта",
    phone: "Телефон",
    city: "Град",
    gender: "Пол на детето",
    consentService: "Согласност (услуга)",
    consentParent: "Согласност (родител)",
    consentMarketing: "Согласност (маркетинг)",
    signupAt: "Датум на пријава",
  };

/** RFC-4180 escape: wrap in quotes (and double internal quotes) when needed. */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Neutralize spreadsheet formula injection: Excel/Sheets treat a cell starting
 * with =, +, -, @ (or a leading tab/CR) as a formula. Parent-controlled fields
 * (first name, city, phone with a leading "+") flow in from the public lead form,
 * so prefix a single quote to force literal text. Excel consumes the prefix and
 * shows the original value. Booleans never hit this (they render "true"/"false").
 */
export function neutralizeFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function cellFor(
  contact: AdminContact,
  key: (typeof ADMIN_CONTACT_KEYS)[number],
): string {
  const raw = contact[key];
  if (typeof raw === "boolean") return raw ? "true" : "false";
  return escapeCsvField(neutralizeFormula(String(raw ?? "")));
}

/**
 * Serialize contacts to CSV text (header row + one row per contact), CRLF line
 * endings. Returns content only — no BOM (the route prepends `CSV_BOM`).
 */
export function toContactsCsv(contacts: readonly AdminContact[]): string {
  const header = ADMIN_CONTACT_KEYS.map((k) =>
    escapeCsvField(CSV_HEADERS[k]),
  ).join(",");
  const rows = contacts.map((c) =>
    ADMIN_CONTACT_KEYS.map((k) => cellFor(c, k)).join(","),
  );
  return [header, ...rows].join("\r\n");
}
