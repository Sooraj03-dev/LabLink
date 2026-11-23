import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import strictTypeScript from "typescript-eslint";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [strictTypeScript.configs.strict],
  },
  globalIgnores([
    ".next/**",
    ".lighthouseci/**",
    "test-results/**",
    "playwright-report/**",
    "out/**",
    "coverage/**",
    "next-env.d.ts",
    ".husky/_/**",
  ]),
]);
