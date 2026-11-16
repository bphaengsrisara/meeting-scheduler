import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts the API and the app for the tests, or reuses ones already running
  // locally. The API needs the compose database: docker compose up -d db
  webServer: [
    {
      command: "pnpm --filter api start",
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
