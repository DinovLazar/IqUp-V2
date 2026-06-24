/**
 * Admin contacts pure core (Phase 2.04): the displayed-fields SHAPE guard
 * (no age, no score/result field — the unjoinable invariant, decision 1), the
 * filters (incl. the marketing-consent-only case), filter parsing, and pagination.
 */

import { describe, expect, it } from "vitest";

import {
  ADMIN_CONTACT_KEYS,
  CONTACTS_PAGE_SIZE,
  exportTypeFor,
  filterContacts,
  paginate,
  parseContactFilters,
  type AdminContact,
} from "../contacts";

function contact(overrides: Partial<AdminContact> = {}): AdminContact {
  return {
    firstName: "Марија",
    email: "m@example.com",
    phone: "070",
    city: "Скопје",
    gender: "female",
    consentService: true,
    consentParent: true,
    consentMarketing: false,
    signupAt: "2026-06-24T10:00:00.000Z",
    ...overrides,
  };
}

describe("AdminContact shape (privacy invariant)", () => {
  it("has NO age and NO score/index/signal/result field", () => {
    const forbidden = [
      "age",
      "score",
      "scores",
      "index",
      "indices",
      "signal",
      "result",
      "band",
      "logic",
      "spatial",
      "memory",
      "planning",
      "stem",
      "gf",
      "gv",
      "gsm",
      "gs",
      "attention",
      "ef",
      "glr",
      "ct",
      "validity",
      "confidence",
    ];
    for (const key of ADMIN_CONTACT_KEYS) {
      const lower = key.toLowerCase();
      for (const bad of forbidden) {
        expect(lower).not.toContain(bad);
      }
    }
  });

  it("is exactly the nine displayed fields", () => {
    expect([...ADMIN_CONTACT_KEYS].sort()).toEqual(
      [
        "city",
        "consentMarketing",
        "consentParent",
        "consentService",
        "email",
        "firstName",
        "gender",
        "phone",
        "signupAt",
      ].sort(),
    );
  });
});

describe("filterContacts", () => {
  const all = [
    contact({ city: "Скопје", gender: "female", consentMarketing: true }),
    contact({ city: "Битола", gender: "male", consentMarketing: false }),
    contact({ city: "Скопје", gender: "male", consentMarketing: true }),
  ];

  it("filters by city (case-insensitive substring)", () => {
    expect(filterContacts(all, { city: "скоп" })).toHaveLength(2);
  });

  it("filters by exact gender code", () => {
    expect(filterContacts(all, { gender: "male" })).toHaveLength(2);
  });

  it("marketing=yes returns ONLY consentMarketing === true", () => {
    const out = filterContacts(all, { marketing: "yes" });
    expect(out).toHaveLength(2);
    expect(out.every((c) => c.consentMarketing === true)).toBe(true);
  });

  it("marketing=no returns ONLY consentMarketing === false", () => {
    const out = filterContacts(all, { marketing: "no" });
    expect(out).toHaveLength(1);
    expect(out.every((c) => c.consentMarketing === false)).toBe(true);
  });

  it("combines filters (AND)", () => {
    expect(
      filterContacts(all, { city: "скопје", marketing: "yes", gender: "male" }),
    ).toHaveLength(1);
  });
});

describe("parseContactFilters", () => {
  it("keeps valid values and drops invalid ones", () => {
    expect(
      parseContactFilters({
        city: "  Скопје  ",
        gender: "female",
        marketing: "yes",
      }),
    ).toEqual({ city: "Скопје", gender: "female", marketing: "yes" });
  });

  it("drops an unknown gender and empty city", () => {
    expect(parseContactFilters({ city: "", gender: "alien" })).toEqual({});
  });

  it("maps marketing 'only' → 'yes' (export convenience)", () => {
    expect(parseContactFilters({ marketing: "only" }).marketing).toBe("yes");
  });

  it("ignores an unknown marketing value", () => {
    expect(
      parseContactFilters({ marketing: "maybe" }).marketing,
    ).toBeUndefined();
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 60 }, (_, i) => i);

  it("returns the requested page, clamped into range", () => {
    const p2 = paginate(items, 2, 25);
    expect(p2.items).toEqual(items.slice(25, 50));
    expect(p2).toMatchObject({ page: 2, pageCount: 3, total: 60 });
  });

  it("clamps an over-range page to the last page", () => {
    expect(paginate(items, 99, 25).page).toBe(3);
  });

  it("clamps a non-positive page to 1", () => {
    expect(paginate(items, 0, 25).page).toBe(1);
  });

  it("defaults to CONTACTS_PAGE_SIZE", () => {
    expect(paginate(items, 1).items).toHaveLength(CONTACTS_PAGE_SIZE);
  });
});

describe("exportTypeFor", () => {
  it("is marketing_only when marketing=yes, else all", () => {
    expect(exportTypeFor({ marketing: "yes" })).toBe("marketing_only");
    expect(exportTypeFor({ marketing: "no" })).toBe("all");
    expect(exportTypeFor({})).toBe("all");
  });
});
