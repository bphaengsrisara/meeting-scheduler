import { describe, expect, it } from "vitest";
import { signedInApi } from "../testing.ts";

describe("GET /candidates", () => {
  it("finds only the user's own candidates", async () => {
    const res = await signedInApi().get("/candidates?q=a");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ candidates: [] });
  });
});
