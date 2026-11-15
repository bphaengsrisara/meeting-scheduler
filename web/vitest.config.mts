import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Vite resolves the @/ alias from tsconfig.json itself.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // Playwright's end-to-end tests live in e2e/ and run with Playwright.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
