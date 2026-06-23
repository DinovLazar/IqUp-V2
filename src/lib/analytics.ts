/**
 * Analytics seam (spec Прилог F). The reserved home for the app's tracking
 * events. In Part 1 `trackEvent` is a typed NO-OP — GA4 + the Meta Pixel/CAPI
 * are wired in Phase 2.03 (server-side `Lead`, deduped via `event_id`; off
 * outside production). Call sites fire the real events now so Part 2 only fills
 * the body, never hunts for the call sites.
 *
 * No PII in analytics (spec Дел 14): event params carry the city only, never the
 * parent's name / email / phone.
 */

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
 * Record an analytics event. Typed so each event name requires exactly its
 * params (and events with no params take none). No-op until Phase 2.03.
 */
export function trackEvent<E extends AnalyticsEventName>(
  ...args: AnalyticsEventParams[E] extends undefined
    ? [name: E]
    : [name: E, params: AnalyticsEventParams[E]]
): void {
  // Part 2 (Phase 2.03) fills this in: forward to GA4 + Meta CAPI with an
  // `event_id` for dedup, gated to production only. Intentionally inert now.
  void args;
}
