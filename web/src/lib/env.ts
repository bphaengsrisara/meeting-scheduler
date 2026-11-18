import "server-only";
import { z } from "zod";

const envSchema = z.object({
  // Where the web server reaches the API.
  API_URL: z.url().default("http://localhost:3001"),
  // Proves to the API that a request comes from this web server.
  API_SECRET: z.string().min(32),
});

let env: z.infer<typeof envSchema> | undefined;

// Checked on first use, at request time: next build loads this file too, and
// the build has no secrets (the server gets them when it runs).
export function getEnv() {
  if (env) return env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  env = result.data;
  return env;
}
