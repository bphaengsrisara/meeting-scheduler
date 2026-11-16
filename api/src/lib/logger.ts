import { pino } from "pino";
import { env } from "../env.ts";

// Request logs must not hold anything that lets someone act as the web server
// or as a signed-in user. pino replaces these values with "[Redacted]".
export const REDACTED_PATHS = [
  'req.headers["x-api-secret"]',
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: REDACTED_PATHS,
  // Readable lines in development, one JSON line per entry elsewhere.
  transport:
    env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
