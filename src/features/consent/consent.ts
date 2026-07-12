/**
 * The consent API (Phase 3.03a — spec §16.3) — a thin, browser-free layer over the
 * `storage` adapter. Everything that reads or writes the decision goes through
 * here; nothing in this file touches `window`/`localStorage` directly (that is
 * confined to `storage.ts`), which is what the guard test asserts.
 *
 * The single rule the rest of the app cares about: `hasAnalyticsConsent()` is the
 * gate `trackEvent` consults (D-169). GA4 + Meta fire ONLY when it returns true —
 * i.e. only after the visitor explicitly chose "Accept all". Undecided, declined,
 * or server-side (SSR) all read as false, so analytics is off by default.
 */

import type { ConsentDecision } from "./schema";
import {
  clearStoredConsent,
  loadStoredConsent,
  notifyConsentChange,
  saveStoredConsent,
  subscribeConsentChange,
} from "./storage";

/** The stored decision, or `undefined` when the visitor has not chosen yet. */
export function getConsent(): ConsentDecision | undefined {
  return loadStoredConsent()?.decision;
}

/** Record a decision and notify subscribers (banner + "manage cookies" control). */
export function setConsent(decision: ConsentDecision): void {
  saveStoredConsent(decision);
  notifyConsentChange();
}

/** Withdraw / reset the decision (→ the banner reappears so the parent can re-choose). */
export function clearConsent(): void {
  clearStoredConsent();
  notifyConsentChange();
}

/**
 * The analytics gate. `true` ONLY when the stored decision is exactly `"accepted"`;
 * `false` when undecided, declined, or on the server. This is the single predicate
 * `trackEvent` checks before forwarding to GA4 / Meta.
 */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}

/**
 * Subscribe to consent changes (same-tab writes + cross-tab changes); returns an
 * unsubscribe. SSR-safe. The banner uses it to hide/show without a page reload.
 */
export function subscribeConsent(listener: () => void): () => void {
  return subscribeConsentChange(listener);
}
