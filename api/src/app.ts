import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { healthRouter } from "./health.ts";
import { logger } from "./lib/logger.ts";
import { errorHandler, notFound } from "./middleware/error-handler.ts";

// Builds the app without starting it, so tests can call it directly.
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(pinoHttp({ logger }));

  app.use(healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
