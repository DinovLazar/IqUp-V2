/**
 * Submit-seam tests (Phase 1.08 + 2.01 + 2.02). `submitLead` now POSTs the lead +
 * result to `/api/lead` (2.02); `runLeadSubmit` is the pure pipeline the form
 * delegates to. As of 2.01 the pipeline ALSO fires the anonymous score write — a
 * separate, non-blocking step decoupled from the lead that must never block the
 * confirmation, even if it throws.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  runLeadSubmit,
  submitLead,
  type LeadFormValues,
  type LeadSubmitDeps,
} from "@/features/lead";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";

const RESULT = scoreProfile(logicStrong);

const VALUES: LeadFormValues = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "070123456",
  city: "Скопје",
  childGender: "female",
  consentService: true,
  consentParent: true,
  consentMarketing: false,
};

/** Build a full set of spied deps; override individual ones per test. */
function makeDeps(overrides: Partial<LeadSubmitDeps> = {}): LeadSubmitDeps {
  return {
    submit: vi.fn(async () => ({ ok: true as const })),
    writeScore: vi.fn(),
    // `track` is the generic `trackEvent` overload; a bare vi.fn() can't satisfy
    // it structurally, so cast (still a real mock at runtime for assertions).
    track: vi.fn() as unknown as LeadSubmitDeps["track"],
    onSubmitted: vi.fn(),
    ...overrides,
  };
}

describe("submitLead (POSTs /api/lead)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs { ...values, result, locale } to /api/lead and resolves on a 2xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitLead(VALUES, RESULT)).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/lead");
    expect(init.method).toBe("POST");
    // The body IS exactly `{ ...values, result, locale }` as it goes over the wire
    // (normalize both sides through JSON: undefined optionals are dropped). The
    // locale defaults to "mk".
    expect(JSON.parse(init.body as string)).toEqual(
      JSON.parse(JSON.stringify({ ...VALUES, result: RESULT, locale: "mk" })),
    );
  });

  it("carries the active locale in the POST body (SR)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await submitLead(VALUES, RESULT, "sr");

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string).locale).toBe("sr");
  });

  it("rejects on a non-2xx response (form shows an error, no confirmation)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    await expect(submitLead(VALUES, RESULT)).rejects.toThrow();
  });
});

describe("runLeadSubmit pipeline", () => {
  it("writes the score, then submits, then tracks, then advances", async () => {
    const order: string[] = [];
    const deps = makeDeps({
      writeScore: vi.fn(() => {
        order.push("score");
      }),
      submit: vi.fn(async () => {
        order.push("submit");
        return { ok: true as const };
      }),
      track: vi.fn(() => {
        order.push("track");
      }),
      onSubmitted: vi.fn(() => {
        order.push("done");
      }),
    });

    await runLeadSubmit(VALUES, RESULT, "mk", deps);

    expect(deps.submit).toHaveBeenCalledWith(VALUES, RESULT, "mk");
    expect(deps.track).toHaveBeenCalledWith("lead_submit", { city: "Скопје" });
    expect(deps.onSubmitted).toHaveBeenCalledWith(VALUES);
    // Score write first; then persist before track before advance.
    expect(order).toEqual(["score", "submit", "track", "done"]);
  });

  it("passes the result + ONLY coarse demographics to the score write (no PII, no lead key)", async () => {
    const writeScore = vi.fn();
    await runLeadSubmit(VALUES, RESULT, "mk", makeDeps({ writeScore }));

    expect(writeScore).toHaveBeenCalledTimes(1);
    const [result, demographics] = writeScore.mock.calls[0];
    expect(result).toBe(RESULT);
    // EXACTLY the coarse demographics — no name/email/phone/consents/lead id.
    expect(demographics).toEqual({
      city: "Скопје",
      childGender: "female",
      language: "mk",
    });
  });

  it("stamps the active locale as the score-row language + the submit locale (SR)", async () => {
    const writeScore = vi.fn();
    const submit = vi.fn(async () => ({ ok: true as const }));
    await runLeadSubmit(VALUES, RESULT, "sr", makeDeps({ writeScore, submit }));

    expect(writeScore.mock.calls[0][1].language).toBe("sr");
    expect(submit).toHaveBeenCalledWith(VALUES, RESULT, "sr");
  });

  it("never blocks the flow if the score write throws (non-blocking)", async () => {
    const deps = makeDeps({
      writeScore: vi.fn(() => {
        throw new Error("score endpoint exploded");
      }),
    });

    // Must still resolve — confirmation + PDF unaffected.
    await expect(
      runLeadSubmit(VALUES, RESULT, "mk", deps),
    ).resolves.toBeUndefined();
    expect(deps.submit).toHaveBeenCalledOnce();
    expect(deps.track).toHaveBeenCalledOnce();
    expect(deps.onSubmitted).toHaveBeenCalledWith(VALUES);
  });

  it("does not track or advance if the submit rejects (but the score still fired)", async () => {
    const deps = makeDeps({
      submit: vi.fn(async () => {
        throw new Error("network down");
      }),
    });

    await expect(runLeadSubmit(VALUES, RESULT, "mk", deps)).rejects.toThrow(
      "network down",
    );
    // Score write is decoupled — it ran before (and independently of) the lead.
    expect(deps.writeScore).toHaveBeenCalledOnce();
    expect(deps.track).not.toHaveBeenCalled();
    expect(deps.onSubmitted).not.toHaveBeenCalled();
  });
});
