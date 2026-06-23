/**
 * Lead-schema tests (Phase 1.08). The schema is the single source of validation,
 * reused unchanged server-side in Part 2 — so each field's rule is pinned here:
 * required/empty handling, the email + permissive-phone validators, the optional
 * fields, and — critically — that BOTH required consents must be `true` in the
 * schema itself (not only in the UI). Error messages are stable TOKENS.
 */

import { describe, expect, it } from "vitest";
import { isPlausiblePhone, leadSchema } from "@/features/lead";

const VALID = {
  parentFirstName: "Марија",
  email: "marija@example.com",
  phone: "+389 70 123 456",
  city: "Скопје",
  consentService: true,
  consentParent: true,
} as const;

/** The first error token for a field (or undefined when the field is valid). */
function tokenFor(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const r = leadSchema.safeParse(input);
  if (r.success) return undefined;
  return r.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("leadSchema — happy path", () => {
  it("accepts a complete, valid lead and trims string fields", () => {
    const r = leadSchema.safeParse({
      ...VALID,
      parentFirstName: "  Марија  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.parentFirstName).toBe("Марија");
  });

  it("accepts when the optional childGender + consentMarketing are absent", () => {
    expect(leadSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts childGender = each allowed key and consentMarketing = false", () => {
    for (const g of ["male", "female", "undisclosed"] as const) {
      expect(
        leadSchema.safeParse({
          ...VALID,
          childGender: g,
          consentMarketing: false,
        }).success,
      ).toBe(true);
    }
  });
});

describe("leadSchema — first name", () => {
  it("rejects empty / whitespace-only", () => {
    expect(tokenFor({ ...VALID, parentFirstName: "" }, "parentFirstName")).toBe(
      "firstNameRequired",
    );
    expect(
      tokenFor({ ...VALID, parentFirstName: "   " }, "parentFirstName"),
    ).toBe("firstNameRequired");
  });
  it("rejects an over-long name", () => {
    expect(
      tokenFor(
        { ...VALID, parentFirstName: "а".repeat(81) },
        "parentFirstName",
      ),
    ).toBe("firstNameTooLong");
  });
});

describe("leadSchema — email", () => {
  it("rejects empty with the required token", () => {
    expect(tokenFor({ ...VALID, email: "" }, "email")).toBe("emailRequired");
  });
  it("rejects a malformed address with the invalid token", () => {
    for (const bad of ["nope", "a@b", "a@b.", "@example.com", "a @b.com"]) {
      expect(tokenFor({ ...VALID, email: bad }, "email")).toBe("emailInvalid");
    }
  });
});

describe("leadSchema — phone (permissive)", () => {
  it("accepts varied valid international formats", () => {
    for (const ok of [
      "070123456",
      "+389 70 123 456",
      "(02) 3109-590",
      "+1-202-555-0143",
    ]) {
      expect(leadSchema.safeParse({ ...VALID, phone: ok }).success).toBe(true);
    }
  });
  it("rejects empty and clearly-non-phone input", () => {
    expect(tokenFor({ ...VALID, phone: "" }, "phone")).toBe("phoneRequired");
    for (const bad of ["abc", "12345", "phone please", "++"]) {
      expect(tokenFor({ ...VALID, phone: bad }, "phone")).toBe("phoneInvalid");
    }
  });
  it("isPlausiblePhone enforces allowed glyphs + a 6–15 digit count", () => {
    expect(isPlausiblePhone("070123456")).toBe(true);
    expect(isPlausiblePhone("12345")).toBe(false); // too few digits
    expect(isPlausiblePhone("1".repeat(16))).toBe(false); // too many digits
    expect(isPlausiblePhone("070-abc")).toBe(false); // illegal glyph
  });
});

describe("leadSchema — city", () => {
  it("rejects empty (free-text, but required)", () => {
    expect(tokenFor({ ...VALID, city: "" }, "city")).toBe("cityRequired");
    expect(tokenFor({ ...VALID, city: "   " }, "city")).toBe("cityRequired");
  });
});

describe("leadSchema — consents (must be true IN THE SCHEMA)", () => {
  it("rejects consentService when false or absent", () => {
    expect(
      tokenFor({ ...VALID, consentService: false }, "consentService"),
    ).toBe("consentServiceRequired");
    const { consentService, ...withoutService } = VALID;
    void consentService;
    expect(tokenFor(withoutService, "consentService")).toBe(
      "consentServiceRequired",
    );
  });

  it("rejects consentParent when false or absent", () => {
    expect(tokenFor({ ...VALID, consentParent: false }, "consentParent")).toBe(
      "consentParentRequired",
    );
    const { consentParent, ...withoutParent } = VALID;
    void consentParent;
    expect(tokenFor(withoutParent, "consentParent")).toBe(
      "consentParentRequired",
    );
  });

  it("treats marketing consent as optional (true / false / absent all ok)", () => {
    for (const m of [true, false, undefined]) {
      expect(
        leadSchema.safeParse({ ...VALID, consentMarketing: m }).success,
      ).toBe(true);
    }
  });
});
