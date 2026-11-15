import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

describe("app", () => {
  it("answers GET /health", async () => {
    const res = await request(createApp()).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns the error shape for an unknown route", async () => {
    const res = await request(createApp()).get("/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Not found" } });
  });
});
