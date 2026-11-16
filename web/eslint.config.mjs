import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  tseslint.configs.strict,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      // This folder, so an editor that loads both apps' configs at once
      // does not have to guess which TypeScript project a file belongs to.
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  // Last, so it can turn off rules that clash with Prettier.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright output:
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
