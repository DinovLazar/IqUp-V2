import * as React from "react";
import { vi } from "vitest";

/**
 * Vitest stub for `@/i18n/navigation` (Feat-Serbian-Localization).
 *
 * The real module is next-intl's `createNavigation(routing)`, whose client
 * navigation hooks (`useRouter`/`usePathname`) reach into `next/navigation` and
 * Next's App Router context — neither is available under jsdom. This stub gives
 * the component tests a benign, deterministic navigation surface:
 *
 *  • `Link` renders a plain `<a>` (so link text/hrefs assert normally),
 *  • `useRouter().replace` is a shared `vi.fn` the locale-switcher test inspects,
 *  • `getPathname` mirrors the `as-needed` prefix rule (MK unprefixed, `/sr` else).
 *
 * Wired via a `resolve.alias` in `vitest.config.ts`; the real module is used by the
 * app itself (dev/build), never aliased there.
 */

export const routerReplace = vi.fn();
export const routerPush = vi.fn();

export function usePathname(): string {
  return "/";
}

export function useRouter() {
  return {
    replace: routerReplace,
    push: routerPush,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  };
}

export function getPathname({
  href,
  locale,
}: {
  href: string;
  locale: string;
}): string {
  if (locale === "mk") return href;
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

export function redirect(): void {
  /* no-op in tests */
}

type LinkProps = {
  href: string | object;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Link({ href, children, ...rest }: LinkProps) {
  const h = typeof href === "string" ? href : "#";
  return (
    <a href={h} {...rest}>
      {children}
    </a>
  );
}
