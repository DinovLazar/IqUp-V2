// @vitest-environment jsdom

/**
 * Phase 3.01 — the localStorage adapter (spec Дел 14.2). Round-trips a valid
 * profile, and fails SOFT (⇒ null) for an empty store, corrupt JSON, or a tampered
 * blob whose shape no longer validates — the assessment must never break because
 * local progress is unavailable. jsdom supplies `window.localStorage`.
 */

import { afterEach, describe, expect, it } from "vitest";
import { scoreProfile, flatTypical } from "@/features/assessment/fixtures";
import { buildStoredProfile } from "../summary";
import {
  STORAGE_KEY,
  clearStoredProfile,
  loadStoredProfile,
  saveStoredProfile,
} from "../storage";

const profile = buildStoredProfile(scoreProfile(flatTypical), {
  setSeed: "seed-x",
  attempt: 1,
});

afterEach(() => window.localStorage.clear());

describe("local progress storage (Дел 14.2)", () => {
  it("round-trips a saved profile", () => {
    saveStoredProfile(profile);
    expect(loadStoredProfile()).toEqual(profile);
  });

  it("returns null when nothing is stored", () => {
    expect(loadStoredProfile()).toBeNull();
  });

  it("returns null for corrupt JSON (fails soft)", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadStoredProfile()).toBeNull();
  });

  it("returns null for a valid-JSON blob with the wrong shape", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schema: 1, hacked: true }),
    );
    expect(loadStoredProfile()).toBeNull();
  });

  it("clear removes the profile", () => {
    saveStoredProfile(profile);
    clearStoredProfile();
    expect(loadStoredProfile()).toBeNull();
  });

  it("uses a versioned key so a future schema bump ignores old blobs", () => {
    expect(STORAGE_KEY).toBe("iqup:progress:v1");
  });
});
