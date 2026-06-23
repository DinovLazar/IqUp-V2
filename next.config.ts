import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the request config (single MVP locale, MK at the root).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `@react-pdf/renderer` (and its fontkit/yoga native-ish deps) must run as a
  // Node external, not be bundled, when the 2.02 `/api/report` route imports the
  // PDF render seam (`src/features/report/pdf`). Declared now so that route works
  // unchanged; harmless until then (nothing imports it in Part 1).
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default withNextIntl(nextConfig);
