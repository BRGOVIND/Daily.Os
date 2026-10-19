import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // Existing hydration and timer hooks use these patterns. Keep their
      // behavior stable during the framework upgrade; refactor separately.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "public/sw.js", "src-tauri/target/**", "next-env.d.ts"]),
]);
