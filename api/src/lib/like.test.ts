import { describe, expect, it } from "vitest";
import { containsPattern } from "./like.ts";

describe("containsPattern", () => {
  it("escapes LIKE's special characters", () => {
    expect(containsPattern(String.raw`50%_a\b`)).toBe(String.raw`%50\%\_a\\b%`);
  });
});
