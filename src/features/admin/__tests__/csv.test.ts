/**
 * Contacts CSV serialization (Phase 2.04): RFC-4180 escaping, the displayed
 * columns only (no age/results), and boolean rendering.
 */

import { describe, expect, it } from "vitest";

import { ADMIN_CONTACT_KEYS } from "../contacts";
import {
  CSV_HEADERS,
  escapeCsvField,
  neutralizeFormula,
  toContactsCsv,
} from "../csv";
import type { AdminContact } from "../contacts";

function contact(overrides: Partial<AdminContact> = {}): AdminContact {
  return {
    firstName: "Марија",
    email: "m@example.com",
    phone: "070 123",
    city: "Скопје",
    gender: "female",
    consentService: true,
    consentParent: true,
    consentMarketing: false,
    signupAt: "2026-06-24T10:00:00.000Z",
    ...overrides,
  };
}

describe("escapeCsvField", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvField("Скопје")).toBe("Скопје");
  });

  it("quotes + doubles quotes for commas/quotes/newlines (incl. CR)", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
    expect(escapeCsvField("a\r\nb")).toBe('"a\r\nb"');
    expect(escapeCsvField("a\rb")).toBe('"a\rb"');
  });
});

describe("neutralizeFormula (spreadsheet injection)", () => {
  it("prefixes a quote to values starting with = + - @ (and tab/CR)", () => {
    expect(neutralizeFormula('=HYPERLINK("http://evil")')).toBe(
      '\'=HYPERLINK("http://evil")',
    );
    expect(neutralizeFormula("+38970123456")).toBe("'+38970123456");
    expect(neutralizeFormula("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(neutralizeFormula("-1+1")).toBe("'-1+1");
  });

  it("leaves ordinary values untouched", () => {
    expect(neutralizeFormula("Марија")).toBe("Марија");
    expect(neutralizeFormula("070 123")).toBe("070 123");
  });
});

describe("toContactsCsv", () => {
  it("has a header row of exactly the displayed columns", () => {
    const csv = toContactsCsv([]);
    const header = csv.split("\r\n")[0];
    expect(header).toBe(
      ADMIN_CONTACT_KEYS.map((k) => CSV_HEADERS[k]).join(","),
    );
    // No age/result column header.
    expect(header.toLowerCase()).not.toContain("возраст");
  });

  it("renders booleans as true/false and escapes risky fields", () => {
    const csv = toContactsCsv([
      contact({ firstName: 'Marko, "the great"', consentMarketing: true }),
    ]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain('"Marko, ""the great"""');
    // consentService/parent true, marketing true → three "true"
    expect(row.match(/true/g)?.length).toBe(3);
  });

  it("produces one row per contact + a header", () => {
    const csv = toContactsCsv([contact(), contact({ email: "b@x.co" })]);
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("neutralizes spreadsheet formula injection in user-controlled fields", () => {
    const csv = toContactsCsv([
      contact({ firstName: "=HYPERLINK(0)", phone: "+38970123456" }),
    ]);
    const row = csv.split("\r\n")[1];
    expect(row).toContain("'=HYPERLINK(0)");
    expect(row).toContain("'+38970123456");
  });

  it("joins rows with CRLF (RFC-4180)", () => {
    const csv = toContactsCsv([contact()]);
    expect(csv).toContain("\r\n");
  });
});
