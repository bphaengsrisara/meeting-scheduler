import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Keep test output free of request logs.
    env: { LOG_LEVEL: "silent" },
  },
});
