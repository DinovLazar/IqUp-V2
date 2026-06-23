/**
 * Profile → IQ UP! program selection (spec Дел 11 / Прилог E). Programs are by AGE,
 * with a basic-vs-PLUS split for the overlapping ages (strong / upper-of-range →
 * PLUS). This is the internal mapping — the program name surfaces in the
 * positioning copy, but the mapping logic itself is „контекст за тимот, не за
 * прераскажување" (carried as `programHook`, never printed verbatim).
 *
 * Pure: same features in → same key out. Shared by the positioning module triggers
 * and the assembler so there is one source of truth.
 *
 *   Прилог E:
 *     5–6   → Мали истражувачи ПЛУС            (single program)
 *     7–9   → Магичната лабораторија на Биби и Боби   (8–10 → … ПЛУС)
 *     10–13 → Научните авантури на Оливер (10–12)     (11–13 → … ПЛУС)
 */

import type { DerivedFeatures, ProgramKey } from "./types";

export function selectProgramKey(f: DerivedFeatures): ProgramKey {
  const plus = f.profileStrength === "plus";
  if (f.age <= 6) return "mali";
  if (f.age <= 9) return plus && f.age >= 8 ? "bibi-plus" : "bibi";
  return plus && f.age >= 11 ? "oliver-plus" : "oliver";
}
