import { cn } from "@/lib/utils";

/**
 * The real IQ UP! brand lockup (puzzle-brain + "EDUCATION THAT INSPIRES"),
 * served as a static `<img>` from `public/brand/iqup-logo.svg`.
 *
 * WHY an <img> and not inlined SVG: the Illustrator export carries a `<style>`
 * block plus gradient/clip-path ids (`linear-gradient`, `clip-path`, …). Inlining
 * it would leak those global class names and ids into the document and collide
 * with anything else on the page — the classic in-app "logo goes black/blank"
 * failure. An external file scopes all of that to the image (see D-156).
 *
 * Plain and isomorphic (no `"use client"`) — it's just an image. The intrinsic
 * `width`/`height` (192×54, the SVG's own viewBox) reserve layout space so the
 * header never shifts as it loads. Default render height is 36px (`h-9`); the
 * lockup is wide (~3.56:1) so callers can override via `className`.
 *
 * `alt` is the brand name ("IQ UP!") — the accessible name, not a transcription
 * of the tagline. This is the in-app header mark ONLY: the e-mail wordmark, the
 * PDF report header, the favicon, and OG images each need their own raster/square
 * asset and are handled separately (D-156).
 */
export function Logo({ className }: { className?: string }) {
  return (
    // A static SVG logo is the right call here, not `next/image`: next/image
    // won't optimize an SVG (and needs `dangerouslyAllowSVG`), and the rule's
    // LCP/bandwidth concern doesn't apply to a small inline-gradient mark.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/iqup-logo.svg"
      alt="IQ UP!"
      width={192}
      height={54}
      decoding="async"
      className={cn("h-9 w-auto", className)}
    />
  );
}
