import { describe, expect, it } from "vitest";
import {
  countFilters,
  dashboardHref,
  parseDashboardParams,
  toMeetingsQuery,
} from "./dashboard-params";

const position = "01a1ec1c-0000-7000-8000-000000000004";

describe("parseDashboardParams", () => {
  it("reads the search, filters and page from the URL", () => {
    expect(
      parseDashboardParams({
        q: " jane ",
        status: "pending",
        position,
        from: "2026-11-01",
        to: "2026-11-30",
        page: "2",
      }),
    ).toEqual({
      q: "jane",
      status: "pending",
      position,
      from: "2026-11-01",
      to: "2026-11-30",
      page: 2,
    });
  });

  it("ignores values that do not parse, so a typed URL never breaks the page", () => {
    expect(
      parseDashboardParams({
        status: "done",
        position: "x",
        from: "11/01",
        page: "-1",
      }),
    ).toEqual({ page: 1 });
  });
});

describe("toMeetingsQuery", () => {
  it("turns the picked days into times in the user's zone, the last day included", () => {
    const query = toMeetingsQuery(
      { q: "jane", from: "2026-11-01", to: "2026-11-30", page: 2 },
      "Asia/Bangkok",
    );

    expect(Object.fromEntries(query)).toEqual({
      page: "2",
      q: "jane",
      from: "2026-10-31T17:00:00.000Z",
      to: "2026-11-30T17:00:00.000Z",
    });
  });
});

describe("dashboardHref", () => {
  it("goes back to page 1 when a filter changes", () => {
    expect(dashboardHref({ q: "jane", page: 3 }, { status: "confirmed" })).toBe(
      "/?q=jane&status=confirmed",
    );
  });

  it("keeps the filters when only the page changes", () => {
    expect(dashboardHref({ q: "jane", page: 1 }, { page: 2 })).toBe(
      "/?q=jane&page=2",
    );
  });
});

describe("countFilters", () => {
  it("counts the date range as one filter", () => {
    expect(
      countFilters({
        q: "jane",
        from: "2026-11-01",
        to: "2026-11-30",
        page: 1,
      }),
    ).toBe(2);
  });
});
