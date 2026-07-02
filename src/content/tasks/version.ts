/**
 * Task-bank version — stored with every anonymous record (spec Дел 19.4) so that
 * future generator/difficulty changes are tracked and results stay comparable
 * over time. Bump on any change that alters generated items for a given seed.
 *
 * Semantic versioning: MAJOR = item shape / answer-key change (breaks old
 * records' comparability), MINOR = new generators or levels, PATCH = tuning that
 * does not change answers. Starts at the MVP baseline.
 */
export const TASK_BANK_VERSION = "2.0.0";
