import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../auth/auth.ts";

// The app's routes need a signed-in user (a guest counts). Better Auth reads
// the session cookie; the user's id goes to res.locals for the handlers.
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: { message: "Sign in to continue" } });
    return;
  }
  res.locals.userId = session.user.id;
  next();
}

export function currentUserId(res: Response): string {
  return res.locals.userId as string;
}
