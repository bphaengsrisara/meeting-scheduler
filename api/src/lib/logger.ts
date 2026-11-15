import { pino } from "pino";
import { env } from "../env.ts";

export const logger = pino({
  level: env.LOG_LEVEL,
  // Readable lines in development, one JSON line per entry elsewhere.
  transport:
    env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
