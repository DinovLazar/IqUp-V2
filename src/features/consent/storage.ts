/**
 * The ONLY module in the consent tree that touches the browser (Phase 3.03a — spec
 * §16.3 / Дел 14). A thin, defensive localStorage adapter for the on-device cookie
 * decision, kept separate from the pure `consent` API + `schema` (mirroring the
 * progress store's pure-core / thin-IO split) so nothing else in the feature — and
 * none of the UI components — reads `window`.
 *
 * Everything here fails SOFT: SSR (no window), privacy mode / disabled storage, a
 * quota error, or a tampered / stale blob all resolve to "no decision" rather than
 * throwing. A missing or unreadable consent record simply means the banner is shown
 * again — analytics stays OFF by default, so failing soft is also failing safe.
 *
 * This module also owns the cross-component change SIGNAL (a `window` custom event
 * + the cross-tab `storage` event). Keeping the event plumbing here — not in
 * `consent.ts` — is what lets the guard test assert that `window`/`localStorage`
 * live in exactly one file, exactly like the progress store.
 */

import {
  CONSENT_VERSION,
  isStoredConsent,
  type ConsentDecision,
  type StoredConsent,
} from "./schema";

/** Versioned key; a schema bump changes the key so old blobs are simply ignored. */
export const CONSENT_STORAGE_KEY = "iqup:cookie-consent:v1";

/**
 * The same-document change event. `consent.ts` re-broadcasts it after every
 * write/clear so the banner and the "manage cookies" control re-render without a
 * full page reload (the cross-tab `storage` event covers other tabs).
 */
export const CONSENT_CHANGED_EVENT = "iqup:consent-changed";

/** Access localStorage without ever throwing (SSR / disabled / privacy mode). */
function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Today as a date-only (`YYYY-MM-DD`) UTC stamp; undefined if the clock is unavailable. */
function todayDateOnly(): string | undefined {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

/** Read + validate the stored decision; null if absent, unreadable, or tampered. */
export function loadStoredConsent(): StoredConsent | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist a decision (date-stamped, versioned); a quota / disabled-storage failure is swallowed. */
export function saveStoredConsent(decision: ConsentDecision): void {
  const store = safeStorage();
  if (!store) return;
  const decidedAt = todayDateOnly();
  const blob: StoredConsent = {
    decision,
    version: CONSENT_VERSION,
    ...(decidedAt ? { decidedAt } : {}),
  };
  try {
    store.setItem(CONSENT_STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // Quota exceeded / storage disabled — the decision is best-effort on-device.
  }
}

/** Remove the stored decision (a withdrawal via the "manage cookies" control). */
export function clearStoredConsent(): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}

/** Broadcast that the decision changed (same-tab custom event); no-op on SSR. */
export function notifyConsentChange(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  } catch {
    // Non-fatal — a subscriber will still catch the next cross-tab storage event.
  }
}

/**
 * Subscribe to consent changes; returns an unsubscribe. Listens for BOTH the
 * same-tab custom event and the cross-tab `storage` event (a decision or a
 * withdrawal made in another tab), so the banner reflects the choice everywhere.
 * SSR-safe: a no-op that returns a no-op when there is no `window`.
 */
export function subscribeConsentChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    // `key === null` fires on `localStorage.clear()`; also react to our own key.
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) listener();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
