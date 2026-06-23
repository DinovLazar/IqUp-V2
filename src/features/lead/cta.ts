/**
 * Booking-CTA helpers (resolved-decision 6). The real booking URL is a pending
 * Cowork asset; until it lands the app uses a clearly-marked, NON-SECRET
 * placeholder via `NEXT_PUBLIC_BOOKING_URL`. The CTA on the confirmation links
 * out as `{bookingUrl}?grad={city}` so the center knows which city the lead came
 * from.
 */

/** Obvious, non-secret default until the real `NEXT_PUBLIC_BOOKING_URL` lands. */
export const BOOKING_URL_PLACEHOLDER = "https://booking.example.invalid";

/**
 * Pure: build the booking link with the city attached and URL-encoded. Kept free
 * of any env/IO read so it is trivially testable and reused on the PDF (1.09).
 */
export function buildBookingHref(bookingUrl: string, city: string): string {
  return `${bookingUrl}?grad=${encodeURIComponent(city)}`;
}

/**
 * The configured booking URL, or the placeholder. Reads the public env var
 * (inlined at build time by Next for `NEXT_PUBLIC_*`); not pure, so it is the
 * one impure seam the confirmation calls before handing the value to the pure
 * `buildBookingHref`.
 */
export function resolveBookingUrl(): string {
  return process.env.NEXT_PUBLIC_BOOKING_URL || BOOKING_URL_PLACEHOLDER;
}
