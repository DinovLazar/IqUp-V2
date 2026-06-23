/**
 * Lead feature — public barrel (Phase 1.08).
 *
 * The shared, framework-free Zod schema (reused unchanged by the Part-2 API
 * route), the stubbed submit orchestrator + its pure pipeline, and the pure
 * booking-href builder. The screens live in `src/app/(site)/procena/`.
 */

export {
  leadSchema,
  isPlausiblePhone,
  GENDER_VALUES,
  type LeadFormValues,
  type ChildGender,
} from "./schema";
export {
  submitLead,
  runLeadSubmit,
  type SubmitLeadResult,
  type LeadSubmitDeps,
} from "./submit";
export {
  buildBookingHref,
  resolveBookingUrl,
  BOOKING_URL_PLACEHOLDER,
} from "./cta";
