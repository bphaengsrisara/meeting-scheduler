import { describe, expect, it } from "vitest";
import {
  formatDay,
  formatMeetingTime,
  isTimeZone,
  startOfDayIn,
  startOfNextDayIn,
} from "./dates";

const start = new Date("2026-11-18T03:00:00Z");
const end = new Date("2026-11-18T04:00:00Z");

describe("formatMeetingTime", () => {
  it("shows the design's format in the user's time zone", () => {
    expect(formatMeetingTime(start, end, "Asia/Bangkok")).toBe(
      "Wed, Nov 18, 2026 · 10:00 AM – 11:00 AM",
    );
  });

  it("moves the day with the zone", () => {
    expect(formatMeetingTime(start, end, "America/Los_Angeles")).toBe(
      "Tue, Nov 17, 2026 · 7:00 PM – 8:00 PM",
    );
  });
});

describe("days in the date filter", () => {
  it("starts a day at midnight in the user's zone", () => {
    expect(startOfDayIn("2026-11-01", "Asia/Bangkok").toISOString()).toBe(
      "2026-10-31T17:00:00.000Z",
    );
    expect(startOfNextDayIn("2026-11-30", "Asia/Bangkok").toISOString()).toBe(
      "2026-11-30T17:00:00.000Z",
    );
  });

  it("labels a day without its weekday", () => {
    expect(formatDay("2026-11-01")).toBe("Nov 1, 2026");
  });
});

describe("isTimeZone", () => {
  it("tells a real zone from a made-up one", () => {
    expect(isTimeZone("Asia/Bangkok")).toBe(true);
    expect(isTimeZone("Not/AZone")).toBe(false);
  });
});
