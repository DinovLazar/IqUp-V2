import "./globals.css";

/**
 * Pass-through root layout (Feat-Serbian-Localization).
 *
 * The app mixes localized routes (`app/[locale]/**` — MK at the root, SR under
 * `/sr`) with non-localized ones (`app/admin/**`, `app/kit/**`). Each of those
 * branches renders its OWN `<html>`/`<body>` (via the shared `RootDocument`),
 * because `<html lang>` must reflect the branch's locale. So this root layout is a
 * pass-through — it only carries the global stylesheet import, which applies to
 * the whole tree.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
