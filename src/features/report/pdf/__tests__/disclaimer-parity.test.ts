import { describe, expect, it } from "vitest";

import { DISCLAIMER_KEYS } from "@/components/ui/disclaimer";
import { PROFILES, scoreProfile } from "@/features/assessment/fixtures";
import { assembleReport } from "@/features/report";
import { buildReportDocument } from "@/features/report/pdf";
import messages from "../../../../../messages/mk.json";

/**
 * Copy-parity guard (Phase 1.10). The "informative, not diagnostic" disclaimer
 * has ONE source — `messages/mk.json` `legal` — read by two renderers: the DOM
 * `Disclaimer` component and the `@react-pdf` document. This ties the PDF to that
 * source THROUGH the component's exported `DISCLAIMER_KEYS`, so any drift (a
 * hardcoded string, a wrong key, a swapped register) breaks the build:
 *   PDF top text    === mk.legal[DISCLAIMER_KEYS.full]   (full §D.4 paragraph)
 *   PDF footer text === mk.legal[DISCLAIMER_KEYS.short]  (short line)
 * The component ↔ mk.json half is asserted in components/ui/__tests__/disclaimer.
 * Mirrors the 1.09 theme sync-guard (one source, two renderers, a test between).
 */

const legal = messages.legal;
const FULL = legal[DISCLAIMER_KEYS.full];
const SHORT = legal[DISCLAIMER_KEYS.short];

// The same pure tree walk the document tests use — collect string leaves by
// calling each function component with its props (no PDF bytes).
function collectText(node: unknown, out: string[]): void {
  if (node == null || node === true || node === false) return;
  if (Array.isArray(node)) {
    for (const n of node) collectText(n, out);
    return;
  }
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (typeof node !== "object" || !("props" in node)) return;
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (typeof el.type === "function") {
    collectText((el.type as (p: unknown) => unknown)(el.props ?? {}), out);
  } else {
    collectText((el.props as { children?: unknown })?.children, out);
  }
}

function pdfTexts(model: ReturnType<typeof assembleReport>): string[] {
  const out: string[] = [];
  collectText(buildReportDocument(model), out);
  return out;
}

describe("disclaimer copy parity — PDF == shared-component keys == mk.json", () => {
  it("DISCLAIMER_KEYS resolve to the canonical, distinct, non-empty mk.json strings", () => {
    expect(FULL).toBe(legal.disclaimer);
    expect(SHORT).toBe(legal.disclaimerShort);
    expect(FULL).not.toBe(SHORT);
    expect(FULL.length).toBeGreaterThan(0);
    expect(SHORT.length).toBeGreaterThan(0);
  });

  it("renders the FULL §D.4 at the top and the SHORT line as the footer for every fixture", () => {
    for (const profile of PROFILES) {
      const texts = pdfTexts(assembleReport(scoreProfile(profile)));
      // Exactly once each in the element tree (top + the single fixed footer).
      expect(texts.filter((x) => x === FULL).length, profile.label).toBe(1);
      expect(texts.filter((x) => x === SHORT).length, profile.label).toBe(1);
    }
  });
});
