/**
 * Server-side deployment-environment resolution (Phase 2.01 → shared in 2.02).
 *
 * One source of truth for "which environment is this server running in," read
 * from `APP_ENV` and never trusted from the client. It is used to:
 *   - stamp `scores.environment` on each anonymous row (`/api/score`, 2.01), and
 *   - pick the Brevo list (production → list 7, everything else → list 8, 2.02).
 *
 * Keeping both behind ONE resolver guarantees the score `environment` stamp and
 * the Brevo list selection always agree (a production row never lands on the test
 * list, and vice-versa).
 */

export const ALLOWED_ENVIRONMENTS = [
  "development",
  "preview",
  "production",
] as const;

export type Environment = (typeof ALLOWED_ENVIRONMENTS)[number];

/**
 * Resolve the deployment environment from `APP_ENV`. Anything unset or
 * unrecognized defaults to `development` (the safe, non-production default — so a
 * misconfigured server writes to the test list, not the production one).
 */
export function resolveEnvironment(): Environment {
  const value = process.env.APP_ENV;
  return (ALLOWED_ENVIRONMENTS as readonly string[]).includes(value ?? "")
    ? (value as Environment)
    : "development";
}
