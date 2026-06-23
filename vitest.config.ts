import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config. The default environment is Node (the pure cores: task bank,
 * engine, scoring, report, lead schema/seams). React component tests (Phase 1.08)
 * are `.test.tsx` files that opt into jsdom per-file via a `// @vitest-environment
 * jsdom` docblock, so the pure suite stays Node-only. The `@/*` alias mirrors
 * tsconfig so tests import the same way as source.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
