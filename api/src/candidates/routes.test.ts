import { describe, expect, it } from "vitest";
import { signedInApi } from "../testing.ts";

// Read-only requests against the compose database: docker compose up -d db.
// The rules are covered by service.test.ts with the database mocked.
const unknownId = "01a1ec1c-0000-7000-8000-000000000000";

describe("GET /candidates", () => {
  it("finds only the user's own candidates", async () => {
    const res = await signedInApi().get("/candidates?q=a");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ candidates: [] });
  });
});

describe("GET /candidates/:id", () => {
  it("answers 404 for a candidate that is not the user's, or a malformed id", async () => {
    const api = signedInApi();

    const missing = await api.get(`/candidates/${unknownId}`);
    const malformed = await api.get("/candidates/not-an-id");

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
  });
});

describe("PATCH /candidates/:id", () => {
  it("answers 400 with the field for a blank name", async () => {
    const res = await signedInApi()
      .patch(`/candidates/${unknownId}`)
      .send({ name: " " });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("name");
  });

  // The user has no candidates, so the update matches no row.
  it("answers 404 for a candidate that is not the user's", async () => {
    const res = await signedInApi()
      .patch(`/candidates/${unknownId}`)
      .send({ notes: "Strong on SQL." });

    expect(res.status).toBe(404);
  });
});
