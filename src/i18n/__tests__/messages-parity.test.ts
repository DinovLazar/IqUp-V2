import { describe, expect, it } from "vitest";

import mk from "../../../messages/mk.json";
import sr from "../../../messages/sr.json";
import { locales } from "@/i18n/routing";

/**
 * Message-file parity (Feat-Serbian-Localization). Every enabled locale must have a
 * message bundle whose key set is EXACTLY the Macedonian one — no missing keys
 * (would render blank / throw) and no extra keys (dead copy that drifts). Arrays
 * must match in length too (e.g. the About page's is/isn't item lists), so a
 * translation that drops a bullet is caught.
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Flatten to a sorted list of `path` (leaf) + `path[]len` (array) markers. */
function keyShape(value: Json, prefix = ""): string[] {
  if (Array.isArray(value)) {
    const out = [`${prefix}[len=${value.length}]`];
    value.forEach((v, i) => out.push(...keyShape(v, `${prefix}[${i}]`)));
    return out;
  }
  if (value && typeof value === "object") {
    const out: string[] = [];
    for (const k of Object.keys(value)) {
      const p = prefix ? `${prefix}.${k}` : k;
      out.push(...keyShape(value[k], p));
    }
    return out;
  }
  return [prefix];
}

const BUNDLES: Record<string, Json> = {
  mk: mk as Json,
  sr: sr as Json,
};

describe("messages parity across enabled locales", () => {
  it("every enabled locale has a bundle", () => {
    for (const locale of locales) {
      expect(BUNDLES[locale], `no bundle for ${locale}`).toBeDefined();
    }
  });

  const mkShape = keyShape(mk as Json).sort();

  for (const locale of locales) {
    if (locale === "mk") continue;
    it(`${locale}.json has exactly the same key + array shape as mk.json`, () => {
      const shape = keyShape(BUNDLES[locale]).sort();
      const missing = mkShape.filter((k) => !shape.includes(k));
      const extra = shape.filter((k) => !mkShape.includes(k));
      expect(missing, `missing in ${locale}: ${missing.join(", ")}`).toEqual(
        [],
      );
      expect(extra, `extra in ${locale}: ${extra.join(", ")}`).toEqual([]);
    });
  }
});
