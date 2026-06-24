/**
 * Brevo server client (Phase 2.02) — `server-only` neutralized (it throws outside a
 * server bundle) and `fetch` mocked (NO live network in CI).
 *
 * Asserts: the right endpoints + headers + payloads; `updateEnabled: true`; the
 * full attribute key-set with correct types; list = 7 in production / 8 otherwise;
 * sender from env; html + text + base64 attachment all present; and that a Brevo
 * error surfaces as a PII-free `BrevoError` (no echoed message).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  BrevoError,
  resolveBrevoListId,
  sendReportEmail,
  upsertLeadContact,
  type LeadContactAttributes,
} from "@/lib/brevo/server";

const ENV_KEYS = [
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "BREVO_SENDER_NAME",
  "BREVO_LIST_ID_PRODUCTION",
  "BREVO_LIST_ID_TEST",
  "APP_ENV",
] as const;

const original: Record<string, string | undefined> = {};
let fetchMock: ReturnType<typeof vi.fn>;

function okResponse(status = 201, json: unknown = { id: 1 }) {
  return { ok: status >= 200 && status < 300, status, json: async () => json };
}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k];
  process.env.BREVO_API_KEY = "test-key";
  process.env.BREVO_SENDER_EMAIL = "noreply@iqup.mk";
  process.env.BREVO_SENDER_NAME = "IQ UP!";
  process.env.BREVO_LIST_ID_PRODUCTION = "7";
  process.env.BREVO_LIST_ID_TEST = "8";
  delete process.env.APP_ENV;

  fetchMock = vi.fn().mockResolvedValue(okResponse());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

const ATTRS: LeadContactAttributes = {
  FIRSTNAME: "Марија",
  PHONE: "070123456",
  CITY: "Скопје",
  CHILD_GENDER: "female",
  LANGUAGE: "mk",
  CONSENT_SERVICE: true,
  CONSENT_PARENT: true,
  CONSENT_MARKETING: false,
  CONSENT_DATE: "2026-06-24",
};

/** Pull the parsed JSON body of the Nth fetch call. */
function bodyOf(call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

describe("upsertLeadContact", () => {
  it("POSTs /v3/contacts with the api-key header and updateEnabled:true", async () => {
    await upsertLeadContact({
      email: "marija@example.com",
      attributes: ATTRS,
      listId: 8,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/contacts");
    expect(init.method).toBe("POST");
    expect(init.headers["api-key"]).toBe("test-key");
    expect(init.headers["content-type"]).toBe("application/json");

    const body = bodyOf();
    expect(body.email).toBe("marija@example.com");
    expect(body.updateEnabled).toBe(true);
    expect(body.listIds).toEqual([8]);
  });

  it("sends the full attribute key-set with correct types", async () => {
    await upsertLeadContact({
      email: "marija@example.com",
      attributes: ATTRS,
      listId: 8,
    });
    const a = bodyOf().attributes;
    expect(Object.keys(a).sort()).toEqual(
      [
        "CHILD_GENDER",
        "CITY",
        "CONSENT_DATE",
        "CONSENT_MARKETING",
        "CONSENT_PARENT",
        "CONSENT_SERVICE",
        "FIRSTNAME",
        "LANGUAGE",
        "PHONE",
      ].sort(),
    );
    expect(typeof a.FIRSTNAME).toBe("string");
    expect(typeof a.PHONE).toBe("string");
    expect(typeof a.CITY).toBe("string");
    expect(typeof a.CHILD_GENDER).toBe("string");
    expect(typeof a.LANGUAGE).toBe("string");
    expect(typeof a.CONSENT_SERVICE).toBe("boolean");
    expect(typeof a.CONSENT_PARENT).toBe("boolean");
    expect(typeof a.CONSENT_MARKETING).toBe("boolean");
    expect(a.CONSENT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws a PII-free BrevoError on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(
      okResponse(400, {
        code: "invalid_parameter",
        message: "the sender noreply@iqup.mk is not valid",
      }),
    );
    let caught: unknown;
    try {
      await upsertLeadContact({
        email: "marija@example.com",
        attributes: ATTRS,
        listId: 8,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BrevoError);
    const err = caught as BrevoError;
    expect(err.status).toBe(400);
    expect(err.code).toBe("invalid_parameter");
    // Never echo the Brevo message (it can carry e-mails / PII).
    expect(err.message).not.toContain("noreply@iqup.mk");
    expect(err.message).not.toContain("not valid");
  });

  it("throws a non-secret config error when BREVO_API_KEY is unset", async () => {
    delete process.env.BREVO_API_KEY;
    await expect(
      upsertLeadContact({
        email: "marija@example.com",
        attributes: ATTRS,
        listId: 8,
      }),
    ).rejects.toThrow(/BREVO_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sendReportEmail", () => {
  it("POSTs /v3/smtp/email with sender from env, html+text+attachment", async () => {
    const pdf = Buffer.from("hello-pdf");
    await sendReportEmail({
      to: { email: "marija@example.com", name: "Марија" },
      subject: "Профил",
      html: "<p>html</p>",
      text: "text",
      pdf,
    });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");

    const body = bodyOf();
    expect(body.sender).toEqual({ email: "noreply@iqup.mk", name: "IQ UP!" });
    expect(body.to).toEqual([{ email: "marija@example.com", name: "Марија" }]);
    expect(body.subject).toBe("Профил");
    expect(body.htmlContent).toBe("<p>html</p>");
    expect(body.textContent).toBe("text");
    expect(body.attachment).toHaveLength(1);
    expect(body.attachment[0].content).toBe(pdf.toString("base64"));
    expect(body.attachment[0].name).toMatch(/\.pdf$/);
  });

  it("throws BrevoError on a non-2xx send", async () => {
    fetchMock.mockResolvedValue(okResponse(400, { code: "invalid_parameter" }));
    await expect(
      sendReportEmail({
        to: { email: "marija@example.com" },
        subject: "x",
        html: "x",
        text: "x",
        pdf: Buffer.from("x"),
      }),
    ).rejects.toBeInstanceOf(BrevoError);
  });
});

describe("resolveBrevoListId — environment, not consent", () => {
  it("returns the production list (7) only in production", () => {
    process.env.APP_ENV = "production";
    expect(resolveBrevoListId()).toBe(7);
  });

  it("returns the test list (8) for development / preview / unset", () => {
    expect(resolveBrevoListId()).toBe(8); // unset → development
    process.env.APP_ENV = "development";
    expect(resolveBrevoListId()).toBe(8);
    process.env.APP_ENV = "preview";
    expect(resolveBrevoListId()).toBe(8);
  });

  it("falls back to the locked IDs when the list env vars are missing", () => {
    delete process.env.BREVO_LIST_ID_PRODUCTION;
    delete process.env.BREVO_LIST_ID_TEST;
    process.env.APP_ENV = "production";
    expect(resolveBrevoListId()).toBe(7);
    process.env.APP_ENV = "development";
    expect(resolveBrevoListId()).toBe(8);
  });
});
