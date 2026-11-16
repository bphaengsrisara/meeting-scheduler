import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../env.ts";

// Both headers are set by the web server on every request it forwards.
export const API_SECRET_HEADER = "x-api-secret";
// The browser's IP. Trusted only after requireApiSecret, since any client
// could send it.
export const CLIENT_IP_HEADER = "x-client-ip";

const digest = (value: string) => createHash("sha256").update(value).digest();
const expected = digest(env.API_SECRET);

// Only the web server knows API_SECRET, so a request without it did not come
// through the web app. Checked before anything trusts the client IP header.
export function requireApiSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sent = req.get(API_SECRET_HEADER);
  // Hashing first gives equal lengths, which timingSafeEqual needs.
  if (sent === undefined || !timingSafeEqual(digest(sent), expected)) {
    res.status(401).json({ error: { message: "Unauthorized" } });
    return;
  }
  next();
}
