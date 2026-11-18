import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { env } from "../env.ts";
import { CLIENT_IP_HEADER } from "./api-secret.ts";

// For the app's own routes; Better Auth limits its routes itself.
// Every request comes from the web server, so the key is the browser's IP
// that the web server forwards, not the address of the connection.
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_PER_MINUTE,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    ipKeyGenerator(req.get(CLIENT_IP_HEADER) ?? req.ip ?? ""),
  // The key does not come from X-Forwarded-For, so its proxy check does not apply.
  validate: { xForwardedForHeader: false },
  handler: (_req, res) => {
    res.status(429).json({ error: { message: "Too many requests" } });
  },
});
