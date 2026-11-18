import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { API_SECRET_HEADER } from "../middleware/api-secret.ts";
import { apiSecret, signedInApi } from "../testing.ts";

// Read-only requests against the compose database: docker compose up -d db.
// Routes that write are covered by service.test.ts with the database mocked.
describe("meetings routes", () => {
  it("needs a signed-in user", async () => {
    const res = await request(createApp())
      .get("/meetings")
      .set(API_SECRET_HEADER, apiSecret);

    expect(res.status).toBe(401);
  });

  it("lists one page of the user's meetings", async () => {
    const res = await signedInApi().get(
      "/meetings?q=jane&status=pending&page=2&from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      meetings: [],
      page: 2,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it("answers 400 with the field for a bad filter", async () => {
    const res = await signedInApi().get("/meetings?status=done");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("status");
  });

  it("answers 404 for a meeting that is not the user's, or a malformed id", async () => {
    const api = signedInApi();

    const missing = await api.get(
      "/meetings/01a1ec1c-0000-7000-8000-000000000000",
    );
    const malformed = await api.get("/meetings/not-an-id");

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
  });

  it("answers 400 for a body that is not JSON", async () => {
    const res = await signedInApi()
      .post("/meetings")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
  });
});
