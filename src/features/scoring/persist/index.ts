/**
 * Scoring persistence — the pure mapping to the anonymous "Store A" row and its
 * validation schema. Deliberately a SEPARATE barrel from `@/features/scoring` so
 * it can be imported by the client (to build the row), by `/api/score` (to
 * validate it) and by tests, without widening the scoring engine's public API.
 *
 * The actual write (the service-role Supabase client) lives server-side in
 * `@/lib/supabase/server` + `src/app/api/score/route.ts` — never here.
 */

export {
  buildScoreRow,
  scoreRowSchema,
  SCORE_ROW_KEYS,
  SIGNAL_KEYS,
  INDEX_COLUMN,
  type ScoreRow,
  type ScoreDemographics,
} from "./score-row";
