import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the pure domain logic (engine / workspace / collab). These
// modules import only types and leaf helpers, so they run in a plain node
// environment with no DOM or IndexedDB.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Match Next.js's automatic JSX runtime so component render smoke tests don't
  // need an explicit `import React` (which the app never uses).
  esbuild: { jsx: "automatic" },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Node by default (pure-logic tests); DOM tests opt in per-file with
    // `// @vitest-environment jsdom`.
    environment: "node",
  },
});
