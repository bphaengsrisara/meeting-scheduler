import { describe, expect, it } from "vitest";
import { pageNumbers } from "./page-numbers";

describe("pageNumbers", () => {
  it("shows every page when there are few", () => {
    expect(pageNumbers(2, 3)).toEqual([1, 2, 3]);
  });

  it("shows the ends and the pages around the current one", () => {
    expect(pageNumbers(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
    expect(pageNumbers(1, 10)).toEqual([1, 2, "…", 10]);
  });
});
