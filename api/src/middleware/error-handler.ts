import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.ts";

// Every error response has the same shape: { error: { message, fields? } }.

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found" } });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Express's own handler must close a response that has already started.
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ error: { message: err.message, fields: err.fields } });
    return;
  }
  // express.json() marks its own errors (bad JSON, body too large) as safe
  // to show, with a 4xx status.
  if (isExposedClientError(err)) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: { message: "Something went wrong" } });
}

function isExposedClientError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    "expose" in err &&
    err.expose === true &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status < 500
  );
}
