/**
 * /api/score route (Phase 2.01) — with the service-role Supabase client MOCKED
 * (the real client imports `server-only`, which throws outside a server bundle).
 *
 * Asserts: a valid row inserts (201) with a SERVER-stamped environment + no
 * client date; PII / extra fields / client-supplied dates are rejected (400) and
 * never reach the DB; malformed JSON is 400; a DB error is 500; and NO PII is
 * logged.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildScoreRow } from "@/features/scoring/persist";
import { scoreProfile, logicStrong } from "@/features/assessment/fixtures";

const { insertMock, fromMock } = vi.hoisted(() => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  return { insertMock, fromMock };
});

vi.mock("@/lib/supabase/server", () => ({
  getServiceRoleClient: () => ({ from: fromMock }),
}));

import { POST } from "@/app/api/score/route";

const VALID_ROW = buildScoreRow(scoreProfile(logicStrong), {
  city: "Скопје",
  childGender: "female",
  language: "mk",
});

function post(body: unknown, raw = false): Request {
  return new Request("http://localhost/api/score", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const originalAppEnv = process.env.APP_ENV;

beforeEach(() => {
  insertMock.mockReset();
  fromMock.mockClear();
  insertMock.mockResolvedValue({ error: null });
  delete process.env.APP_ENV;
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalAppEnv === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = originalAppEnv;
});

describe("POST /api/score — happy path", () => {
  it("inserts a valid row and returns 201", async () => {
    const res = await POST(post(VALID_ROW));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith("scores");
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("stamps environment SERVER-side from APP_ENV and never trusts the client", async () => {
    process.env.APP_ENV = "production";
    await POST(post(VALID_ROW));
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "production" }),
    );
  });

  it("defaults environment to development when APP_ENV is unset or invalid", async () => {
    await POST(post(VALID_ROW));
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "development" }),
    );

    insertMock.mockClear();
    process.env.APP_ENV = "not-an-env";
    await POST(post(VALID_ROW));
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "development" }),
    );
  });

  it("never inserts a client-supplied date, id, or environment column", async () => {
    await POST(post(VALID_ROW));
    const inserted = insertMock.mock.calls[0][0];
    expect(inserted).not.toHaveProperty("created_date");
    expect(inserted).not.toHaveProperty("created_at");
    expect(inserted).not.toHaveProperty("id");
    // environment is present — but server-set, not from the client payload.
    expect(inserted.environment).toBe("development");
  });
});

describe("POST /api/score — rejects bad input without touching the DB", () => {
  it("rejects a PII field (400) and does not insert", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(post({ ...VALID_ROW, email: "marija@example.com" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "invalid_payload",
    });
    expect(insertMock).not.toHaveBeenCalled();
    // No PII in logs: the email value must never be logged.
    for (const call of warn.mock.calls) {
      expect(String(call[0])).not.toContain("marija@example.com");
    }
  });

  it("rejects a client-supplied created_date (400)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(post({ ...VALID_ROW, created_date: "2020-01-01" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a client-supplied environment (400)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(post({ ...VALID_ROW, environment: "production" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects out-of-range scores (400)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(post({ ...VALID_ROW, gf: 999 }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON (400)", async () => {
    const res = await POST(post("{not json", true));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "invalid_json",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/score — DB failure", () => {
  it("returns 500 (PII-free) when the insert errors", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    insertMock.mockResolvedValue({ error: { code: "23514", message: "x" } });
    const res = await POST(post(VALID_ROW));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "write_failed",
    });
    expect(error).toHaveBeenCalled();
  });
});
