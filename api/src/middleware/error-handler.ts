import type { NextFunction, Request, Response } from "express";

// Every error response has the same shape: { error: { message } }.

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
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: { message: "Something went wrong" } });
}
