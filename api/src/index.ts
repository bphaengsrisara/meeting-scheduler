import { createApp } from "./app.ts";
import { env } from "./env.ts";
import { logger } from "./lib/logger.ts";

createApp().listen(env.PORT, (error) => {
  if (error) {
    throw error;
  }
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
