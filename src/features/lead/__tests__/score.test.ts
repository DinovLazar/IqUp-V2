/**
 * Client score-write path (Phase 2.01).
 *
 * Proves the REAL `postScore` / `writeScore` — the production mechanism behind the
 * phase's headline guarantee ("a score-write failure must never block the
 * confirmation or PDF") — with `fetch` mocked. `submit.test.ts` only exercises a
 * SYNCHRONOUS throw via a mocked dep; this covers the actual async failure paths:
 * a non-2xx response and a network rejection, and the `.catch()` that swallows
 * them without leaking an unhandled rejection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postScore, writeScore } from "../score";
import { buildScoreRow } from "@/features/scoring/persist";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";

const RESULT = scoreProfile(logicStrong);
const DEMO = { city: "Скопје", childGender: "female" as const, language: "mk" };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("postScore", () => {
  it("POSTs the built no-PII row as JSON to /api/score", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    await postScore(RESULT, DEMO);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/score");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    // Exactly the pure builder's output — no PII, no extra fields.
    expect(JSON.parse(init.body)).toEqual(buildScoreRow(RESULT, DEMO));
  });

  it("rejects on a non-2xx response (so the throw branch is exercised)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(postScore(RESULT, DEMO)).rejects.toThrow(/500/);
  });
});

describe("writeScore (fire-and-forget, non-blocking)", () => {
  it("returns void synchronously and still fires the write", () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
    const ret = writeScore(RESULT, DEMO);
    expect(ret).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("swallows a non-2xx response without leaking an unhandled rejection", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const leaks = await captureRejections(() => writeScore(RESULT, DEMO));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(leaks).toEqual([]);
  });

  it("swallows a network failure without leaking an unhandled rejection", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const leaks = await captureRejections(() => writeScore(RESULT, DEMO));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(leaks).toEqual([]);
  });
});

/**
 * Run `fn`, then let the internal promise + its `.catch()` settle, recording any
 * unhandled rejection that escapes (none should — the `.catch()` is what makes the
 * write non-blocking).
 */
async function captureRejections(fn: () => void): Promise<unknown[]> {
  const leaks: unknown[] = [];
  const handler = (reason: unknown) => leaks.push(reason);
  process.on("unhandledRejection", handler);
  try {
    fn();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
    return leaks;
  } finally {
    process.off("unhandledRejection", handler);
  }
}
