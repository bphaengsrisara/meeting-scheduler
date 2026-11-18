import { describe, expect, it } from "vitest";
import type { Meeting } from "@/features/meetings/types";
import { latestMeeting } from "./latest-meeting";

const meeting = (id: string, startAt: string) => ({ id, startAt }) as Meeting;

describe("latestMeeting", () => {
  it("picks the meeting that starts last, wherever it is in the list", () => {
    const meetings = [
      meeting("past", "2026-11-10T03:00:00.000Z"),
      meeting("next-week", "2026-11-25T03:00:00.000Z"),
      meeting("tomorrow", "2026-11-19T03:00:00.000Z"),
    ];
    expect(latestMeeting(meetings)?.id).toBe("next-week");
  });

  it("has none for a candidate with no meetings", () => {
    expect(latestMeeting([])).toBeUndefined();
  });
});
