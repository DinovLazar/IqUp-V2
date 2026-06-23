import { describe, expect, it } from "vitest";
import { Polygon } from "@react-pdf/renderer";

import {
  PROFILES,
  scoreProfile,
  logicStrong,
  strongInvalid,
} from "@/features/assessment/fixtures";
import { assembleReport } from "@/features/report";
import { buildReportDocument } from "@/features/report/pdf";
import messages from "../../../../../messages/mk.json";

/**
 * Document-tree tests (Phase 1.09) — assert on the PURE `@react-pdf` element tree
 * `buildReportDocument` returns (not byte output), mirroring the 1.08 confirmation
 * guards:
 *  - the no-number invariant (spec Дел 10.2): no parent-facing numeric index score
 *    anywhere in the rendered text — the same strong „zero digits“ check the
 *    confirmation uses (all parent copy is digit-free; the numeric value reaches
 *    the page only as pentagon GEOMETRY, which lives in props, not text children);
 *  - the presence of every required Дел 10.3 section in the normal variant;
 *  - the retry variant: graceful-retry message, NO pentagon, NO confident profile.
 */

const legal = messages.legal;

type Collected = { leaves: (string | number)[]; elements: { type: unknown }[] };

/**
 * Walk the pure element tree, collecting primitive leaf children + every element.
 * The PDF builder uses pure, hook-free function components (Header, PentagonPdf,
 * IndexRow, Block, …); to see their text/shapes we render each by calling it with
 * its props (a mini-renderer over the element tree — still no PDF bytes). Host
 * elements (string type, e.g. <Text>/<Polygon>) are descended via `props.children`
 * only, so numeric SVG/layout props (x, y, points, width) are never collected.
 */
function collect(node: unknown, out: Collected): void {
  if (node == null || node === true || node === false) return;
  if (Array.isArray(node)) {
    for (const n of node) collect(n, out);
    return;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.leaves.push(node);
    return;
  }
  if (typeof node !== "object" || !("props" in node)) return;
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  out.elements.push({ type: el.type });
  if (typeof el.type === "function") {
    const render = el.type as (props: unknown) => unknown;
    collect(render(el.props ?? {}), out);
  } else {
    collect((el.props as { children?: unknown })?.children, out);
  }
}

function walk(model: ReturnType<typeof assembleReport>) {
  const out: Collected = { leaves: [], elements: [] };
  collect(buildReportDocument(model), out);
  const texts = out.leaves.filter((l): l is string => typeof l === "string");
  return {
    out,
    texts,
    numericLeaves: out.leaves.filter((l) => typeof l === "number"),
    joined: texts.join("\n"),
    hasType: (t: unknown) => out.elements.some((e) => e.type === t),
    // §16.1 placement #4: the FULL §D.4 paragraph at the top, the SHORT line as
    // the fixed footer (Phase 1.10). Counted separately so the split is asserted.
    fullCount: texts.filter((x) => x === legal.disclaimer).length,
    shortCount: texts.filter((x) => x === legal.disclaimerShort).length,
  };
}

describe("PDF document tree — determinism", () => {
  const typeSeq = (w: ReturnType<typeof walk>) =>
    w.out.elements.map((e) =>
      typeof e.type === "function"
        ? `fn:${(e.type as { name?: string }).name ?? ""}`
        : String(e.type),
    );

  it("same model → identical text + element structure for every fixture", () => {
    for (const profile of PROFILES) {
      const model = assembleReport(scoreProfile(profile));
      const a = walk(model);
      const b = walk(model);
      expect(a.texts, profile.label).toEqual(b.texts);
      expect(typeSeq(a), profile.label).toEqual(typeSeq(b));
    }
  });
});

describe("PDF document tree — no-number invariant", () => {
  it("renders ZERO digits and zero numeric text leaves for every fixture", () => {
    for (const profile of PROFILES) {
      const model = assembleReport(scoreProfile(profile));
      const { joined, numericLeaves } = walk(model);
      expect(/\d/.test(joined), `digit in ${profile.label}`).toBe(false);
      expect(numericLeaves, `numeric leaf in ${profile.label}`).toEqual([]);
    }
  });

  it("never prints any index numeric value as text", () => {
    const model = assembleReport(scoreProfile(logicStrong));
    const { joined } = walk(model);
    for (const idx of model.indices ?? []) {
      expect(joined).not.toContain(String(Math.round(idx.value)));
    }
  });
});

describe("PDF document tree — normal profile contains every Дел 10.3 section", () => {
  const model = assembleReport(scoreProfile(logicStrong));
  const { joined, hasType, fullCount, shortCount } = walk(model);
  const t = messages.reportPdf;

  it("is a profile variant with a pentagon (Polygon present)", () => {
    expect(model.variant).toBe("profile");
    expect(hasType(Polygon)).toBe(true);
  });

  it("shows the branded header + part banners", () => {
    expect(joined).toContain(t.wordmark);
    expect(joined).toContain(t.docTitle);
    expect(joined).toContain(t.partATitle);
    expect(joined).toContain(t.partBTitle);
  });

  it("shows all five index bands (label + word + range) and a confidence word", () => {
    for (const idx of model.indices ?? []) {
      expect(joined).toContain(idx.label);
      expect(joined).toContain(idx.wordLabel);
      expect(joined).toContain(idx.range);
    }
    const confWords = Object.values(t.confidence);
    expect(confWords.some((w) => joined.includes(w))).toBe(true);
  });

  it("shows top strength, growth area, solving style and home activities", () => {
    const partA = model.partA!;
    expect(joined).toContain(partA.topStrength.text);
    expect(joined).toContain(partA.growthArea.text);
    expect(joined).toContain(partA.solvingStyle.text);
    expect(joined).toContain(t.activitiesTitle);
    const someActivity = partA.activities.flatMap((a) => a.items)[0];
    expect(joined).toContain(someActivity);
  });

  it("shows Part Б (STEM readiness + bridge)", () => {
    const partB = model.partB!;
    expect(joined).toContain(partB.readiness.text);
    expect(joined).toContain(partB.stemBridge.text);
  });

  it("shows the IQ UP! positioning text + program name (but not the internal hook)", () => {
    const pos = model.positioning!;
    expect(joined).toContain(pos.text);
    expect(joined).toContain(pos.program.name);
    expect(joined).not.toContain(pos.programHook);
  });

  it("shows the CTA text and the §D.4 disclaimer at top (full) AND bottom (short)", () => {
    expect(joined).toContain(model.cta?.text ?? t.ctaFallback);
    expect(fullCount).toBe(1); // full §D.4 at the top only
    expect(shortCount).toBe(1); // short line as the fixed footer
  });

  it("never prints internal version metadata (two-register rule)", () => {
    for (const v of [
      model.meta.reportEngineVersion,
      model.meta.moduleLibraryVersion,
      model.meta.scoringVersion,
    ]) {
      expect(joined).not.toContain(v);
    }
  });
});

describe("PDF document tree — retry variant", () => {
  const model = assembleReport(scoreProfile(strongInvalid));
  const { joined, hasType, fullCount, shortCount } = walk(model);

  it("is the retry variant with no confident profile", () => {
    expect(model.variant).toBe("retry");
    expect(model.indices).toBeNull();
    expect(model.partA).toBeNull();
  });

  it("renders the graceful-retry message and NO pentagon", () => {
    expect(joined).toContain(messages.confirmation.retryTitle);
    expect(joined).toContain(
      model.validity.note ?? messages.confirmation.retryNote,
    );
    expect(hasType(Polygon)).toBe(false);
  });

  it("still places the §D.4 disclaimer at top (full) AND bottom (short)", () => {
    expect(fullCount).toBe(1);
    expect(shortCount).toBe(1);
  });
});
