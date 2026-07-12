/**
 * Analytics seam (spec Прилог F). The reserved home for the app's tracking
 * events. In Part 1 `trackEvent` is a typed NO-OP — GA4 + the Meta Pixel/CAPI
 * are wired in Phase 2.03 (server-side `Lead`, deduped via `event_id`; off
 * outside production). Call sites fire the real events now so Part 2 only fills
 * the body, never hunts for the call sites.
 *
 * No PII in analytics (spec Дел 14): event params carry the city only, never the
 * parent's name / email / phone.
 *
 * Consent gate (Phase 3.03a — spec §16.3, D-169): `trackEvent` first consults
 * `hasAnalyticsConsent()`. Non-essential analytics (GA4 + Meta) fire ONLY after the
 * visitor chose "Accept all" in the cookie banner; undecided or "Essential only"
 * short-circuits to a no-op. This is the single analytics choke-point. Essential
 * cookies — the next-intl `NEXT_LOCALE` locale cookie and the Supabase admin
 * session — are strictly necessary and are NOT gated here.
 */

import { hasAnalyticsConsent } from "@/features/consent";

/** The parameter shape for each Appendix F event this build fires. */
export interface AnalyticsEventParams {
  /** The lead form mounted (no params). */
  form_view: undefined;
  /** A lead was submitted successfully. */
  lead_submit: { city: string };
  /** The booking CTA was clicked. */
  cta_booking_click: { city: string; source: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

/**
 * The concrete per-event argument tuples as a union (`["form_view"] |
 * ["lead_submit", {…}] | …`). Unlike the conditional generic on `trackEvent`, this
 * is a plain tuple union, so the gate can spread the caller's args into the
 * forwarder without TS's "spread must be a tuple" error.
 */
export type AnalyticsTrackArgs = {
  [E in AnalyticsEventName]: AnalyticsEventParams[E] extends undefined
    ? [name: E]
    : [name: E, params: AnalyticsEventParams[E]];
}[AnalyticsEventName];

/**
 * Record an analytics event. Typed so each event name requires exactly its
 * params (and events with no params take none). No-op until Phase 2.03.
 *
 * The consent GATE lives here and runs FIRST: without `hasAnalyticsConsent()`,
 * `trackEvent` returns before touching the forward body, so no event can reach GA4
 * / Meta without an explicit "Accept all". The forward itself is `analyticsForwarder.forward`
 * (below) — a separate seam so the gate is unit-testable and 2.03 has one place to
 * add the real push, entirely behind the gate.
 */
export function trackEvent<E extends AnalyticsEventName>(
  ...args: AnalyticsEventParams[E] extends undefined
    ? [name: E]
    : [name: E, params: AnalyticsEventParams[E]]
): void {
  // Consent gate (D-169) — the first and only guard. Undecided / "Essential only"
  // / SSR all read false, so analytics is off by default.
  if (!hasAnalyticsConsent()) return;
  // The cast bridges the generic conditional tuple to the concrete tuple union —
  // always one of its members, so it is sound.
  analyticsForwarder.forward(...(args as AnalyticsTrackArgs));
}

/**
 * The forward body, reached ONLY past the consent gate. Split onto an object (not a
 * bare local function) so a unit test can spy on `.forward` to prove the gate
 * guards it, and so Phase 2.03 has a single, clearly-gated place to add the GA4 +
 * Meta CAPI push. Not part of the app-facing API — always call `trackEvent`.
 */
export const analyticsForwarder = {
  forward(...args: AnalyticsTrackArgs): void {
    // Part 2 (Phase 2.03) fills this in: forward to GA4 + Meta CAPI with an
    // `event_id` for dedup, gated to production only. Intentionally inert now.
    void args;
  },
};
