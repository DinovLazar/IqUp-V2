import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation wrappers (Feat-Serbian-Localization). These are thin
 * wrappers around Next.js' navigation APIs that keep the active locale in sync
 * with the URL prefix defined in `routing.ts`:
 *
 *  • `Link` / `useRouter` prepend `/sr` when the active locale is Serbian and keep
 *    the root path for Macedonian (the default).
 *  • `usePathname` returns the pathname WITHOUT the locale prefix, so the switcher
 *    can re-render the same page under a different locale.
 *
 * The header locale switcher uses `usePathname` + `useRouter().replace(...)` to
 * move between the equivalent MK/SR routes.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
