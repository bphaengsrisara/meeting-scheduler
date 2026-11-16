import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";
import { db } from "./db/client.ts";
import { API_SECRET_HEADER } from "./middleware/api-secret.ts";

// Same value as API_SECRET in vitest.config.ts.
const apiSecret = "test-only-api-secret-0000000000000000000000";

// GET /health queries the compose database: docker compose up -d db
describe("app", () => {
  it("answers GET /health when the database is up", async () => {
    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("answers 503 on GET /health when the database is down", async () => {
    vi.spyOn(db, "execute").mockRejectedValueOnce(new Error("no database"));

    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: { message: "Database unavailable" } });
  });

  it("refuses a request without the API secret", async () => {
    const res = await request(createApp()).get("/api/auth/ok");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: "Unauthorized" } });
  });

  it("refuses a request with a wrong API secret", async () => {
    const res = await request(createApp())
      .get("/api/auth/ok")
      .set(API_SECRET_HEADER, "wrong");

    expect(res.status).toBe(401);
  });

  it("serves Better Auth with the API secret", async () => {
    const res = await request(createApp())
      .get("/api/auth/ok")
      .set(API_SECRET_HEADER, apiSecret);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns the error shape for an unknown route", async () => {
    const res = await request(createApp())
      .get("/does-not-exist")
      .set(API_SECRET_HEADER, apiSecret);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Not found" } });
  });

  it("limits each browser IP to 100 requests a minute", async () => {
    const app = createApp();
    const send = (ip: string) =>
      request(app)
        .get("/does-not-exist")
        .set(API_SECRET_HEADER, apiSecret)
        .set("x-client-ip", ip);

    for (let i = 0; i < 100; i++) {
      await send("203.0.113.1");
    }

    expect((await send("203.0.113.1")).status).toBe(429);
    // Another browser is counted on its own.
    expect((await send("203.0.113.2")).status).toBe(404);
  });
});

describe("sign-up password length", () => {
  // Both are refused before anything is written to the database.
  const signUp = (password: string) =>
    request(createApp())
      .post("/api/auth/sign-up/email")
      .set(API_SECRET_HEADER, apiSecret)
      .set("Origin", "http://localhost:3000")
      .send({ email: "length-check@example.com", name: "", password });

  it("refuses a password shorter than 15 characters", async () => {
    const res = await signUp("a".repeat(14));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("PASSWORD_TOO_SHORT");
  });

  it("refuses a password longer than 64 characters", async () => {
    const res = await signUp("a".repeat(65));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("PASSWORD_TOO_LONG");
  });
});
