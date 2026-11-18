import request from "supertest";
import { vi } from "vitest";
import { createApp } from "./app.ts";
import { auth } from "./auth/auth.ts";
import { API_SECRET_HEADER } from "./middleware/api-secret.ts";

// Same value as API_SECRET in vitest.config.ts.
export const apiSecret = "test-only-api-secret-0000000000000000000000";

// A user with no data, so the read-only route tests find nothing of theirs.
export const testUserId = "01a1ec1c-0000-7000-8000-00000000ffff";

// Requests as the web server would send them, for a signed-in user whose
// session Better Auth is made to return (no session row is written).
export function signedInApi() {
  vi.spyOn(auth.api, "getSession").mockResolvedValue({
    user: { id: testUserId },
  } as never);
  const app = createApp();
  return {
    get: (path: string) =>
      request(app).get(path).set(API_SECRET_HEADER, apiSecret),
    post: (path: string) =>
      request(app).post(path).set(API_SECRET_HEADER, apiSecret),
  };
}
