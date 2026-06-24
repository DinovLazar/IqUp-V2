/**
 * Print a sample anonymous score row as JSON (Phase 2.01) — the exact payload the
 * client POSTs to /api/score, built with the production `buildScoreRow` from a
 * deterministic fixture. Handy for eyeballing the shape and for a local e2e write:
 *
 *   npx tsx scripts/dump-score-row.ts | curl -sS -X POST localhost:3000/api/score \
 *     -H 'content-type: application/json' --data-binary @-
 *
 * Mirrors scripts/dump-tasks.ts — generation only; writes nothing.
 */

import { buildScoreRow } from "../src/features/scoring/persist";
import { scoreProfile, logicStrong } from "../src/features/assessment/fixtures";

const row = buildScoreRow(scoreProfile(logicStrong), {
  city: "Скопје",
  childGender: "female",
  language: "mk",
});

process.stdout.write(JSON.stringify(row));
