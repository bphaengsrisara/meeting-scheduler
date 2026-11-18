import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Signs Better Auth's session cookies. Better Auth warns below 32 characters.
  BETTER_AUTH_SECRET: z.string().min(32),
  // This API's own address, used by Better Auth.
  BETTER_AUTH_URL: z.url().default("http://localhost:3001"),
  // The web app; Better Auth accepts requests from this origin only.
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  // Requests a minute from one browser on the app's own routes (A5). The
  // end-to-end tests raise it: they all come from one machine.
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(100),
  // Shared with the web server only; every request except /health needs it.
  // At least 32 characters, the same as BETTER_AUTH_SECRET.
  API_SECRET: z.string().min(32),
});

// Throws with every invalid variable listed, so the API stops at startup.
export function parseEnv(source: Record<string, string | undefined>) {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

export const env = parseEnv(process.env);
