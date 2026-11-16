// @ts-check
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      // This folder, so an editor that loads both apps' configs at once
      // does not have to guess which TypeScript project a file belongs to.
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  // Last, so it can turn off rules that clash with Prettier.
  prettier,
);
