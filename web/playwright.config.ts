import { defineConfig, devices } from "@playwright/test";

// Requests a minute the API allows during the end-to-end tests.
const E2E_RATE_LIMIT = 1000;

export default defineConfig({
  testDir: "./e2e",
  // CI runners are slower, and next dev compiles each page on its first
  // visit; 5 seconds (Playwright's default) was not always enough there.
  expect: { timeout: process.env.CI ? 15_000 : 5000 },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts the API and the app for the tests, or reuses ones already running
  // locally. The API needs the compose database: docker compose up -d db
  webServer: [
    {
      // A higher rate limit: every test's requests come from this machine,
      // more than one browser's 100 a minute (the API's default).
      command: `RATE_LIMIT_PER_MINUTE=${E2E_RATE_LIMIT} pnpm --filter api start`,
      url: "http://localhost:3001/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
