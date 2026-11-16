import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.ts";
import { db } from "./db/client.ts";

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

  it("returns the error shape for an unknown route", async () => {
    const res = await request(createApp()).get("/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Not found" } });
  });
});
