import { describe, expect, it } from "vitest";
import { signedInApi } from "../testing.ts";

// Against the compose database, which the migrations have filled.
describe("GET /positions", () => {
  it("lists the positions by name", async () => {
    const res = await signedInApi().get("/positions");

    expect(res.status).toBe(200);
    const names = (res.body.positions as { name: string }[]).map((p) => p.name);
    expect(names).toContain("Software Engineer");
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
