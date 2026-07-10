import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config. The default environment is Node (the pure cores: task bank,
 * engine, scoring, report, lead schema/seams). React component tests (Phase 1.08)
 * are `.test.tsx` files that opt into jsdom per-file via a `// @vitest-environment
 * jsdom` docblock, so the pure suite stays Node-only. The `@/*` alias mirrors
 * tsconfig so tests import the same way as source.
 *
 * `@/i18n/navigation` is aliased to a jsdom-safe stub (Feat-Serbian-Localization):
 * the real module is next-intl's client navigation, which needs `next/navigation` +
 * an App Router context that jsdom lacks. The alias list is ORDER-SENSITIVE — the
 * specific `@/i18n/navigation` entry must precede the general `@` entry.
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@/i18n/navigation",
        replacement: fileURLToPath(
          new URL("./test/mocks/i18n-navigation.tsx", import.meta.url),
        ),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
