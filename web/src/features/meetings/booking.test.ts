import { describe, expect, it } from "vitest";
import {
  defaultEndTime,
  emptyMeetingForm,
  meetingFormSchema,
  meetingToForm,
  NAME_MAX,
  overlapMessage,
  overlaps,
  toFormErrors,
  toMeetingChanges,
  toNewMeeting,
  type MeetingFormInput,
} from "./booking";
import type { Meeting } from "./types";

const ZONE = "Asia/Bangkok";

const filled: MeetingFormInput = {
  candidateId: "",
  candidateName: "Jan Novak",
  positionId: "position-1",
  date: "2026-11-20",
  startTime: "10:00",
  endTime: "11:00",
  type: "online",
  platform: "zoom",
  notes: "",
};

const messages = (values: MeetingFormInput) => {
  const result = meetingFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe("meetingFormSchema", () => {
  it("accepts a filled form", () => {
    expect(meetingFormSchema.safeParse(filled).success).toBe(true);
  });

  it("asks for every required field", () => {
    expect(messages(emptyMeetingForm)).toEqual({
      candidateName: "Enter the candidate's name.",
      positionId: "Choose a position.",
      date: "Choose a date.",
      startTime: "Enter a start time.",
      endTime: "Enter an end time.",
      type: "Choose the meeting type.",
    });
  });

  it("refuses an end time that is not after the start", () => {
    expect(messages({ ...filled, endTime: "10:00" })).toEqual({
      endTime: "End time must be after start time.",
    });
  });

  it("asks for the type, and a platform when online", () => {
    expect(messages({ ...filled, type: "" })).toEqual({
      type: "Choose the meeting type.",
    });
    expect(messages({ ...filled, platform: "" })).toEqual({
      platform: "Choose a platform.",
    });
  });

  it("keeps the API's name limit", () => {
    expect(
      messages({ ...filled, candidateName: "a".repeat(NAME_MAX + 1) }),
    ).toEqual({ candidateName: `Use ${NAME_MAX} characters or fewer.` });
  });
});

describe("what the form sends", () => {
  const values = meetingFormSchema.parse(filled);

  it("sends the times in UTC and a new candidate by name", () => {
    expect(toNewMeeting(values, ZONE)).toEqual({
      candidateName: "Jan Novak",
      positionId: "position-1",
      startAt: "2026-11-20T03:00:00.000Z",
      endAt: "2026-11-20T04:00:00.000Z",
      type: "online",
      platform: "zoom",
      notes: null,
    });
  });

  it("sends an existing candidate by id", () => {
    const body = toNewMeeting({ ...values, candidateId: "candidate-1" }, ZONE);
    expect(body).toMatchObject({ candidateId: "candidate-1" });
    expect(body).not.toHaveProperty("candidateName");
  });

  it("sends no platform for an onsite meeting", () => {
    const onsite = { ...values, type: "on_site" as const };
    expect(toMeetingChanges(onsite, ZONE).platform).toBeNull();
  });
});

describe("meetingToForm", () => {
  it("shows a stored meeting in the user's time zone", () => {
    const meeting: Meeting = {
      id: "meeting-1",
      startAt: "2026-11-20T03:00:00.000Z",
      endAt: "2026-11-20T04:30:00.000Z",
      type: "on_site",
      platform: null,
      status: "pending",
      notes: null,
      candidate: { id: "candidate-1", name: "Jane Doe" },
      position: { id: "position-1", name: "QA Engineer" },
      feedback: null,
    };
    expect(meetingToForm(meeting, ZONE)).toEqual({
      candidateId: "candidate-1",
      candidateName: "Jane Doe",
      positionId: "position-1",
      date: "2026-11-20",
      startTime: "10:00",
      endTime: "11:30",
      type: "on_site",
      platform: "",
      notes: "",
    });
  });
});

describe("defaultEndTime", () => {
  it("is an hour after the start", () => {
    expect(defaultEndTime("09:30")).toBe("10:30");
  });

  it("stays empty past midnight", () => {
    expect(defaultEndTime("23:30")).toBe("");
  });
});

describe("overlaps", () => {
  const picked = {
    start: new Date("2026-11-20T03:00:00Z"),
    end: new Date("2026-11-20T04:00:00Z"),
  };

  it("finds a meeting that shares any time", () => {
    expect(
      overlaps(picked, {
        startAt: "2026-11-20T03:30:00Z",
        endAt: "2026-11-20T05:00:00Z",
      }),
    ).toBe(true);
  });

  it("lets meetings sit back to back", () => {
    expect(
      overlaps(picked, {
        startAt: "2026-11-20T04:00:00Z",
        endAt: "2026-11-20T05:00:00Z",
      }),
    ).toBe(false);
  });
});

describe("overlapMessage", () => {
  it("names the meeting and its times in the user's zone", () => {
    expect(
      overlapMessage(
        {
          startAt: "2026-11-20T02:00:00Z",
          endAt: "2026-11-20T03:00:00Z",
          candidate: { name: "Somchai K." },
        },
        ZONE,
      ),
    ).toBe(
      "This time overlaps your meeting with Somchai K. (9:00 AM – 10:00 AM). Choose a time that doesn't overlap it.",
    );
  });
});

describe("toFormErrors", () => {
  it("puts the API's field messages on the form's fields", () => {
    expect(
      toFormErrors({
        startAt: ["Start time must be later than now."],
        candidateId: ["Pick one from the list."],
        unknown: ["Ignored."],
      }),
    ).toEqual([
      { name: "startTime", message: "Start time must be later than now." },
      { name: "candidateName", message: "Pick one from the list." },
    ]);
  });
});
