import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import messages from "../../../../../messages/mk.json";

/**
 * Single-source guard (Phase 1.10). The §16.1 disclaimer copy must live ONLY in
 * `messages/mk.json` (the shared `legal` namespace). This scans production source
 * (src/**\/*.{ts,tsx}, excluding __tests__) and asserts neither the full §D.4
 * paragraph nor the short line survives as a hardcoded literal — so a future
 * "just paste the text here" can't silently reintroduce drift. It also asserts
 * each canonical string appears EXACTLY ONCE in mk.json (the duplicate
 * per-screen short keys removed in 1.10 can't creep back).
 */

const FULL = messages.legal.disclaimer;
const SHORT = messages.legal.disclaimerShort;

const SRC = fileURLToPath(new URL("../../../../../src", import.meta.url));
const MK = fileURLToPath(
  new URL("../../../../../messages/mk.json", import.meta.url),
);

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "__tests__" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sourceFiles(p, acc);
    else if (/\.tsx?$/.test(name)) acc.push(p);
  }
  return acc;
}

describe("disclaimer single-source guard", () => {
  const files = sourceFiles(SRC);

  it("scans a non-trivial number of production source files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("no production .ts/.tsx file hardcodes the full or short disclaimer text", () => {
    const offenders = files
      .filter((f) => {
        const text = readFileSync(f, "utf8");
        return text.includes(FULL) || text.includes(SHORT);
      })
      .map((f) => f.slice(SRC.length));
    expect(
      offenders,
      `hardcoded disclaimer in: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("each canonical disclaimer string appears exactly once in mk.json", () => {
    const raw = readFileSync(MK, "utf8");
    const countOf = (needle: string) => raw.split(needle).length - 1;
    expect(countOf(FULL)).toBe(1);
    expect(countOf(SHORT)).toBe(1);
  });
});
