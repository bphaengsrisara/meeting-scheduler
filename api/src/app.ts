import { toNodeHandler } from "better-auth/node";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { auth } from "./auth/auth.ts";
import { candidatesRouter } from "./candidates/routes.ts";
import { healthRouter } from "./health.ts";
import { logger } from "./lib/logger.ts";
import { meetingsRouter } from "./meetings/routes.ts";
import { requireApiSecret } from "./middleware/api-secret.ts";
import { errorHandler, notFound } from "./middleware/error-handler.ts";
import { rateLimiter } from "./middleware/rate-limit.ts";
import { requireSession } from "./middleware/require-session.ts";
import { positionsRouter } from "./positions/routes.ts";

// Builds the app without starting it, so tests can call it directly.
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(pinoHttp({ logger }));

  // Open, for the host's health checks.
  app.use(healthRouter);

  // Everything below answers only the web server.
  app.use(requireApiSecret);

  // Sign-up, login, guest and session routes. Better Auth reads the request
  // body itself, so this comes before any body parser.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  app.use(rateLimiter);
  app.use(express.json());

  // The app's routes, for signed-in users (guests included) only.
  app.use("/positions", requireSession, positionsRouter);
  app.use("/candidates", requireSession, candidatesRouter);
  app.use("/meetings", requireSession, meetingsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
