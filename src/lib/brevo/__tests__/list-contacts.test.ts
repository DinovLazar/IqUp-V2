/**
 * Brevo admin contacts reader (Phase 2.04) — `server-only` neutralized, `fetch`
 * mocked. Asserts: the GET endpoint + paging params; the map yields ONLY the
 * displayed `AdminContact` fields (no LANGUAGE/CONSENT_DATE/score leak); boolean
 * consents are coerced; and `fetchAllContactsFromList` pages to the list total.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  fetchAllContactsFromList,
  listContactsFromList,
} from "@/lib/brevo/server";
import { ADMIN_CONTACT_KEYS } from "@/features/admin";

let fetchMock: ReturnType<typeof vi.fn>;
const originalKey = process.env.BREVO_API_KEY;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function brevoContact(email: string, extra: Record<string, unknown> = {}) {
  return {
    email,
    createdAt: "2026-06-24T10:00:00.000+00:00",
    attributes: {
      FIRSTNAME: "Марија",
      PHONE: "070123456",
      CITY: "Скопје",
      CHILD_GENDER: "female",
      LANGUAGE: "mk",
      CONSENT_SERVICE: true,
      CONSENT_PARENT: true,
      CONSENT_MARKETING: false,
      CONSENT_DATE: "2026-06-24",
      ...extra,
    },
  };
}

beforeEach(() => {
  process.env.BREVO_API_KEY = "test-key";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = originalKey;
});

describe("listContactsFromList", () => {
  it("calls the list-contacts endpoint with limit/offset/sort", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ contacts: [], count: 0 }));
    await listContactsFromList({ listId: 8, limit: 50, offset: 100 });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/contacts/lists/8/contacts");
    expect(url).toContain("limit=50");
    expect(url).toContain("offset=100");
    expect(url).toContain("sort=desc");
  });

  it("maps to ONLY the displayed AdminContact fields (no attribute leak)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ contacts: [brevoContact("m@x.co")], count: 1 }),
    );
    const { contacts, count } = await listContactsFromList({
      listId: 8,
      limit: 50,
      offset: 0,
    });
    expect(count).toBe(1);
    const c = contacts[0];
    expect(Object.keys(c).sort()).toEqual([...ADMIN_CONTACT_KEYS].sort());
    // No leaked Brevo-internal attributes.
    expect(Object.keys(c)).not.toContain("LANGUAGE");
    expect(Object.keys(c)).not.toContain("CONSENT_DATE");
    expect(c).toMatchObject({
      firstName: "Марија",
      email: "m@x.co",
      city: "Скопје",
      gender: "female",
      consentService: true,
      consentMarketing: false,
      // signup is normalized to DATE-ONLY at the mapping boundary.
      signupAt: "2026-06-24",
    });
  });

  it("coerces string/number consent attributes to booleans", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        contacts: [
          brevoContact("s@x.co", {
            CONSENT_MARKETING: "true",
            CONSENT_PARENT: 1,
            CONSENT_SERVICE: "false",
          }),
        ],
        count: 1,
      }),
    );
    const { contacts } = await listContactsFromList({
      listId: 8,
      limit: 50,
      offset: 0,
    });
    expect(contacts[0].consentMarketing).toBe(true);
    expect(contacts[0].consentParent).toBe(true);
    expect(contacts[0].consentService).toBe(false);
  });
});

describe("fetchAllContactsFromList", () => {
  it("stops after a short page and reports the total", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        contacts: [brevoContact("a@x.co"), brevoContact("b@x.co")],
        count: 2,
      }),
    );
    const { contacts, total, truncated } = await fetchAllContactsFromList({
      listId: 8,
    });
    expect(total).toBe(2);
    expect(contacts).toHaveLength(2);
    expect(truncated).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pages again when a full page (500) is returned", async () => {
    const full = Array.from({ length: 500 }, (_, i) =>
      brevoContact(`u${i}@x.co`),
    );
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ contacts: full, count: 502 }))
      .mockResolvedValueOnce(
        jsonResponse({
          contacts: [brevoContact("last1@x.co"), brevoContact("last2@x.co")],
          count: 502,
        }),
      );
    const { contacts, total } = await fetchAllContactsFromList({ listId: 8 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(total).toBe(502);
    expect(contacts).toHaveLength(502);
  });

  it("clamps to max and reports truncated when the list exceeds the cap", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        contacts: [brevoContact("a@x.co"), brevoContact("b@x.co")],
        count: 2,
      }),
    );
    const { contacts, total, truncated } = await fetchAllContactsFromList({
      listId: 8,
      max: 1,
    });
    expect(total).toBe(2);
    expect(contacts).toHaveLength(1); // .slice(0, max) clamped
    expect(truncated).toBe(true); // total (2) > max (1)
  });

  it("keeps paging when a full page reports a bogus count (0)", async () => {
    const full = Array.from({ length: 500 }, (_, i) =>
      brevoContact(`u${i}@x.co`),
    );
    // A self-contradictory response: a full 500-row page but count 0. The
    // count-guard must NOT short-circuit; the short next page terminates.
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ contacts: full, count: 0 }))
      .mockResolvedValueOnce(
        jsonResponse({ contacts: [brevoContact("tail@x.co")], count: 0 }),
      );
    const { contacts } = await fetchAllContactsFromList({ listId: 8 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(contacts).toHaveLength(501);
  });
});
