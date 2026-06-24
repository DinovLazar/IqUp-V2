/**
 * /api/lead route (Phase 2.02) — Brevo client + PDF render MOCKED (no live network,
 * no font IO). `assembleReport` (1.07) and `buildReportEmail` run REAL.
 *
 * Asserts: validation rejects bad input / missing consents (400, no upsert); the
 * contact carries the built-ins + the 8 custom attributes (server-set LANGUAGE +
 * CONSENT_DATE, stable gender code) and ZERO score/result fields (unjoinable); the
 * upsert is the success gate (its failure → route error, no e-mail); the e-mail is
 * best-effort (its failure → route still succeeds + logs); and the server re-assembled
 * report equals the client model for all five fixtures.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { upsertMock, sendMock, listMock, renderMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  sendMock: vi.fn(),
  listMock: vi.fn(() => 8),
  renderMock: vi.fn(async () => Buffer.from("pdf-bytes")),
}));

vi.mock("@/lib/brevo/server", () => ({
  upsertLeadContact: upsertMock,
  sendReportEmail: sendMock,
  resolveBrevoListId: listMock,
}));

vi.mock("@/features/report/pdf", () => ({
  renderReportPdf: renderMock,
}));

import { POST } from "@/app/api/lead/route";
import { assembleReport } from "@/features/report";
import {
  PROFILES,
  logicStrong,
  scoreProfile,
} from "@/features/assessment/fixtures";

const RESULT = scoreProfile(logicStrong);

const VALID_LEAD = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "070123456",
  city: "Скопје",
  childGender: "female" as const,
  consentService: true,
  consentParent: true,
  consentMarketing: true,
};

const ATTR_KEYS = [
  "CHILD_GENDER",
  "CITY",
  "CONSENT_DATE",
  "CONSENT_MARKETING",
  "CONSENT_PARENT",
  "CONSENT_SERVICE",
  "FIRSTNAME",
  "LANGUAGE",
  "PHONE",
].sort();

function post(body: unknown, raw = false): Request {
  return new Request("http://localhost/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function withResult(lead: Record<string, unknown>) {
  return post({ ...lead, result: RESULT });
}

/** Shallow copy of `VALID_LEAD` with one key removed (no unused-var destructure). */
function omit(key: keyof typeof VALID_LEAD): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...VALID_LEAD };
  delete clone[key];
  return clone;
}

beforeEach(() => {
  upsertMock.mockReset().mockResolvedValue(undefined);
  sendMock.mockReset().mockResolvedValue(undefined);
  renderMock.mockReset().mockResolvedValue(Buffer.from("pdf-bytes"));
  listMock.mockReset().mockReturnValue(8);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/lead — happy path", () => {
  it("upserts, renders the PDF, sends the e-mail, returns 200", async () => {
    const res = await POST(withResult(VALID_LEAD));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledOnce();
    expect(renderMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it("builds the contact: built-ins + 8 custom attributes, list resolved", async () => {
    await POST(withResult(VALID_LEAD));
    const contact = upsertMock.mock.calls[0][0];
    expect(Object.keys(contact).sort()).toEqual([
      "attributes",
      "email",
      "listId",
    ]);
    expect(contact.email).toBe("marija@example.com");
    expect(contact.listId).toBe(8);

    const a = contact.attributes;
    expect(Object.keys(a).sort()).toEqual(ATTR_KEYS);
    expect(a.FIRSTNAME).toBe("Марија");
    expect(a.PHONE).toBe("070123456");
    expect(a.CITY).toBe("Скопје");
    expect(a.CHILD_GENDER).toBe("female"); // stable code, not a localized label
    expect(a.LANGUAGE).toBe("mk");
    expect(a.CONSENT_SERVICE).toBe(true);
    expect(a.CONSENT_PARENT).toBe(true);
    expect(a.CONSENT_MARKETING).toBe(true);
    expect(a.CONSENT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("renders the PDF from the server-assembled model + the parent's city", async () => {
    await POST(withResult(VALID_LEAD));
    expect(renderMock).toHaveBeenCalledWith(assembleReport(RESULT), {
      city: "Скопје",
    });
  });

  it("server-sets LANGUAGE + CONSENT_DATE, ignoring any client-sent values", async () => {
    await POST(
      post({
        ...VALID_LEAD,
        language: "en",
        CONSENT_DATE: "2000-01-01",
        result: RESULT,
      }),
    );
    const a = upsertMock.mock.calls[0][0].attributes;
    expect(a.LANGUAGE).toBe("mk");
    expect(a.CONSENT_DATE).not.toBe("2000-01-01");
  });

  it("CHILD_GENDER is empty when gender is not provided", async () => {
    await POST(withResult(omit("childGender")));
    expect(upsertMock.mock.calls[0][0].attributes.CHILD_GENDER).toBe("");
  });

  it("CONSENT_MARKETING is false when not given", async () => {
    await POST(withResult(omit("consentMarketing")));
    expect(upsertMock.mock.calls[0][0].attributes.CONSENT_MARKETING).toBe(
      false,
    );
  });
});

describe("POST /api/lead — unjoinable invariant (spec §14.1)", () => {
  it("the contact carries no score/result/lead-key fields", async () => {
    await POST(withResult(VALID_LEAD));
    const contact = upsertMock.mock.calls[0][0];
    const allKeys = [
      ...Object.keys(contact),
      ...Object.keys(contact.attributes),
    ];
    const forbidden = [
      "result",
      "indices",
      "signals",
      "validity",
      "logic",
      "spatial",
      "gf",
      "gv",
      "score",
      "scores",
      "id",
    ];
    for (const k of forbidden) expect(allKeys).not.toContain(k);
  });
});

describe("POST /api/lead — rejects bad input without upserting", () => {
  it("rejects a missing required field (400)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(withResult(omit("email")));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "invalid_payload",
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects a missing required consent (400)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(
      withResult({ ...VALID_LEAD, consentService: false }),
    );
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON (400)", async () => {
    const res = await POST(post("{not json", true));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "invalid_json",
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/lead — upsert is the success gate", () => {
  it("returns 502 and skips the e-mail when the upsert fails", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    upsertMock.mockRejectedValue(new Error("Brevo /contacts failed: HTTP 500"));
    const res = await POST(withResult(VALID_LEAD));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "lead_failed",
    });
    expect(sendMock).not.toHaveBeenCalled();
    expect(renderMock).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe("POST /api/lead — e-mail is best-effort", () => {
  it("still returns 200 + logs when the send fails (incl. pre-DNS noreply@)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendMock.mockRejectedValue(
      new Error("Brevo /smtp/email failed: HTTP 400 (invalid_parameter)"),
    );
    const res = await POST(withResult(VALID_LEAD));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(upsertMock).toHaveBeenCalledOnce(); // the lead WAS captured
    expect(errSpy).toHaveBeenCalled();
  });

  it("still returns 200 when the PDF render fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderMock.mockRejectedValue(new Error("render boom"));
    const res = await POST(withResult(VALID_LEAD));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/lead — server re-assembly determinism (5 fixtures)", () => {
  it("the server-assembled report equals the client model for every profile", () => {
    for (const profile of PROFILES) {
      const result = scoreProfile(profile);
      const clientModel = assembleReport(result);
      // Round-trip through the request body, then re-assemble server-side.
      const wire = JSON.parse(JSON.stringify(result));
      const serverModel = assembleReport(wire);
      expect(serverModel).toEqual(clientModel);
    }
  });
});
