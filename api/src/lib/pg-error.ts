// PostgreSQL error codes the API turns into answers for the user.
export const EXCLUSION_VIOLATION = "23P01";
export const FOREIGN_KEY_VIOLATION = "23503";
export const UNIQUE_VIOLATION = "23505";

type PgError = { code: string; constraint?: string };

// Drizzle wraps the driver's error, so the PostgreSQL one is in a cause.
export function findPgError(err: unknown): PgError | undefined {
  let current = err;
  while (current instanceof Error) {
    if ("code" in current && typeof current.code === "string") {
      return current as Error & PgError;
    }
    current = current.cause;
  }
  return undefined;
}
