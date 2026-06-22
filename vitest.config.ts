import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest config for the task-bank test suite (Phase 1.04). Pure Node tests, no
 * DOM. The `@/*` alias mirrors tsconfig so tests import the same way as source.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
