import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import { describe, expect, it } from "vitest";

/**
 * Font coverage (Phase 1.09) — the bundled Montserrat TTFs must exist and contain
 * every Macedonian Cyrillic glyph (incl. the MK-specific Ѓѓ Ќќ Љљ Њњ Џџ Ѕѕ Јј) plus
 * the Latin/punctuation the report uses, so the rendered PDF shows real letters,
 * never tofu boxes. `fontkit` is the same parser `@react-pdf` embeds with.
 */

const FONT_DIR = join(process.cwd(), "src/features/report/pdf/fonts");
const FILES = [
  "Montserrat-Regular.ttf",
  "Montserrat-Medium.ttf",
  "Montserrat-SemiBold.ttf",
  "Montserrat-Bold.ttf",
  "Montserrat-ExtraBold.ttf",
];

// Full Macedonian alphabet (upper + lower).
const MK = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШабвгдѓежзѕијклљмнњопрстќуфхцчџш";
// Latin + punctuation the chrome/CTA/wordmark use ("IQ UP!", "STEM", bullets, ellipsis).
const EXTRA = "IQUPSTEMabc·–—…!?";

describe("PDF fonts — Montserrat (Cyrillic + Latin)", () => {
  it("bundles all five weights", () => {
    for (const f of FILES) {
      expect(existsSync(join(FONT_DIR, f)), f).toBe(true);
    }
  });

  it("covers every Macedonian + required Latin glyph in every weight", () => {
    for (const f of FILES) {
      const font = fontkit.create(readFileSync(join(FONT_DIR, f)));
      const missing = [...(MK + EXTRA)].filter(
        (ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)!),
      );
      expect(missing, `${f} missing: ${missing.join("")}`).toEqual([]);
    }
  });
});
