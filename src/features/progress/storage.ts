/**
 * The ONLY module in the progress tree that touches the browser — a thin, defensive
 * localStorage adapter for the anonymous on-device profile (spec Дел 14.2). Kept
 * separate from the pure summary/compare/repeat logic (mirroring the timing layer's
 * pure-core / thin-IO split) so nothing else in the feature reads `window`.
 *
 * Everything here fails SOFT: SSR (no window), privacy mode / disabled storage, a
 * quota error, or a tampered / stale blob all resolve to "no prior profile" rather
 * than throwing — the assessment must never break because local progress is
 * unavailable. The payload is a small JSON blob (a handful of numbers + short
 * strings), comfortably within the ~5 MB localStorage budget, so IndexedDB is
 * unnecessary (D-144).
 */

import { isStoredProfile, type StoredProfile } from "./schema";

/** Versioned key; a schema bump changes the key so old blobs are simply ignored. */
export const STORAGE_KEY = "iqup:progress:v1";

/** Access localStorage without ever throwing (SSR / disabled / privacy mode). */
function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Read + validate the stored profile; null if absent, unreadable, or tampered. */
export function loadStoredProfile(): StoredProfile | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist the profile; a quota / disabled-storage failure is swallowed (non-fatal). */
export function saveStoredProfile(profile: StoredProfile): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota exceeded / storage disabled — local progress is best-effort.
  }
}

/** Remove the stored profile (e.g. a future "forget my progress" control). */
export function clearStoredProfile(): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}
