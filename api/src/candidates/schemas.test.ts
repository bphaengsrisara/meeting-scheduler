import { describe, expect, it } from "vitest";
import { updateCandidateBody } from "./schemas.ts";

describe("updateCandidateBody", () => {
  it("trims the name and stores empty notes as none", () => {
    const body = updateCandidateBody.parse({ name: " Jane Doe ", notes: "  " });

    expect(body).toEqual({ name: "Jane Doe", notes: null });
  });

  it("refuses a blank name", () => {
    const result = updateCandidateBody.safeParse({ name: "   " });

    expect(result.success).toBe(false);
  });

  it("needs something to change", () => {
    const result = updateCandidateBody.safeParse({});

    expect(result.success).toBe(false);
  });
});
