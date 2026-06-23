import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * The shared "informative, not diagnostic" disclaimer (Phase 1.10).
 *
 * ONE source for the spec §16.1 disclaimer so the line can never drift between
 * screens. All copy lives in `messages/mk.json` under the shared `legal`
 * namespace — nothing is hardcoded here. Two registers:
 *  - `short` — the condensed footnote line (`legal.disclaimerShort`), used in
 *    spots where a single line is enough (landing footnote, pre-start screen).
 *  - `full`  — the complete §D.4 paragraph (`legal.disclaimer`), used where the
 *    full statement is required (results/confirmation, the About-the-test page).
 *
 * Isomorphic by design: it uses next-intl's `useTranslations` (no `"use client"`,
 * no client-only API), so it renders as a Server Component on the static pages
 * and inside the "use client" flow screens alike — both read the same single
 * source. The §D.4 text carries no links, so there is nothing focusable here; if
 * a future legal revision adds a link, render it as a real focusable anchor.
 *
 * The `@react-pdf` report (`features/report/pdf/document.tsx`) cannot import this
 * DOM component, so it restates the SAME `legal` keys (top = full, footer =
 * short). A copy-parity guard test ties the two renderers to the single mk.json
 * source — mirroring the `pentagon.ts` / `pentagon.tsx` one-source / two-renderer
 * split and the 1.09 theme sync-guard.
 */

export type DisclaimerVariant = "full" | "short";

/**
 * The single source of WHICH `legal` key each register reads. The PDF parity
 * guard imports this to assert the PDF top/footer strings equal the same mk.json
 * keys this component renders — so the three (component ↔ mk.json ↔ PDF) can't
 * drift apart silently.
 */
export const DISCLAIMER_KEYS = {
  full: "disclaimer",
  short: "disclaimerShort",
} as const satisfies Record<DisclaimerVariant, string>;

export interface DisclaimerProps extends Omit<
  React.ComponentPropsWithoutRef<"p">,
  "children"
> {
  /** `short` (default) renders the footnote line; `full` renders the §D.4 paragraph. */
  variant?: DisclaimerVariant;
}

export function Disclaimer({
  variant = "short",
  className,
  ...props
}: DisclaimerProps) {
  const t = useTranslations("legal");
  return (
    <p
      data-disclaimer={variant}
      className={cn(
        "text-label font-normal text-muted",
        variant === "full" && "leading-relaxed",
        className,
      )}
      {...props}
    >
      {t(DISCLAIMER_KEYS[variant])}
    </p>
  );
}
