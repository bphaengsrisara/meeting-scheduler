import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // Keep test output free of request logs.
      LOG_LEVEL: "silent",
      // The compose database; the /health test queries it.
      DATABASE_URL:
        "postgres://postgres:postgres@localhost:5432/meeting_scheduler",
    },
  },
});
