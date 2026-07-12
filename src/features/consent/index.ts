/**
 * Cookie consent — public barrel (Phase 3.03a, spec §16.3 / Дел 14).
 *
 * A third, purely on-device store (D-170) recording ONE bit: did the visitor allow
 * non-essential analytics cookies? It gates `trackEvent` (D-169) so GA4 + Meta can
 * never fire without an explicit "Accept all", and it fills the 7th "informative,
 * not diagnostic" disclaimer placement via the banner (spec §16.1).
 *
 * Split like the progress store: pure schema + a browser-free `consent` API over a
 * single thin IO adapter (`storage`). This barrel exposes only the store API — the
 * `"use client"` UI (`cookie-banner`, `cookie-settings`) is imported by path where
 * it mounts, so a server module (e.g. `@/lib/analytics`) can import the gate
 * without pulling a React component.
 */

export {
  CONSENT_VERSION,
  isStoredConsent,
  storedConsentSchema,
  type ConsentDecision,
  type StoredConsent,
} from "./schema";

export {
  clearConsent,
  getConsent,
  hasAnalyticsConsent,
  setConsent,
  subscribeConsent,
} from "./consent";

export {
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  clearStoredConsent,
  loadStoredConsent,
  saveStoredConsent,
} from "./storage";
