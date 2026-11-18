import { describe, expect, it } from "vitest";
import {
  createMeetingBody,
  feedbackBody,
  listMeetingsQuery,
} from "./schemas.ts";

const booking = {
  positionId: "01a1ec1c-0000-7000-8000-000000000004",
  startAt: "2026-11-19T03:00:00+07:00",
  endAt: "2026-11-19T04:00:00+07:00",
  type: "on_site",
};

describe("createMeetingBody", () => {
  it("takes a new candidate's name and email, trimmed, and empty notes as none", () => {
    const body = createMeetingBody.parse({
      ...booking,
      candidateName: "  Jane Doe ",
      candidateEmail: " Jane.Doe@Example.com ",
      notes: "  ",
    });

    expect(body.candidateName).toBe("Jane Doe");
    // Kept as typed; the database compares emails without case.
    expect(body.candidateEmail).toBe("Jane.Doe@Example.com");
    expect(body.notes).toBeNull();
    expect(body.platform).toBeNull();
    expect(body.startAt).toEqual(new Date("2026-11-18T20:00:00Z"));
  });

  it("needs exactly one of candidateId and candidateName", () => {
    const neither = createMeetingBody.safeParse(booking);
    const both = createMeetingBody.safeParse({
      ...booking,
      candidateId: "01a1ec1c-0000-7000-8000-000000000003",
      candidateName: "Jane Doe",
    });

    expect(neither.success).toBe(false);
    expect(both.success).toBe(false);
  });

  it("needs a valid email for a new candidate, and none for an existing one", () => {
    const missing = createMeetingBody.safeParse({
      ...booking,
      candidateName: "Jane Doe",
    });
    const invalid = createMeetingBody.safeParse({
      ...booking,
      candidateName: "Jane Doe",
      candidateEmail: "jane.doe",
    });
    const existing = createMeetingBody.safeParse({
      ...booking,
      candidateId: "01a1ec1c-0000-7000-8000-000000000003",
    });

    expect(missing.error?.issues[0].path).toEqual(["candidateEmail"]);
    expect(invalid.error?.issues[0].message).toBe(
      "Enter a valid email address.",
    );
    expect(existing.success).toBe(true);
  });

  it("refuses a time without its offset", () => {
    const result = createMeetingBody.safeParse({
      ...booking,
      candidateName: "Jane Doe",
      candidateEmail: "jane.doe@example.com",
      startAt: "2026-11-19T03:00:00",
    });

    expect(result.success).toBe(false);
  });
});

describe("listMeetingsQuery", () => {
  it("reads numbers from the query string and fills the defaults", () => {
    expect(listMeetingsQuery.parse({ page: "3" })).toEqual({
      page: 3,
      pageSize: 10,
    });
  });

  it("refuses an unknown status", () => {
    expect(listMeetingsQuery.safeParse({ status: "done" }).success).toBe(false);
  });
});

describe("feedbackBody", () => {
  it("needs one of the four recommendations; the comment is optional", () => {
    const body = feedbackBody.parse({ recommendation: "strong_yes" });
    const unknown = feedbackBody.safeParse({ recommendation: "maybe" });

    expect(body).toEqual({ recommendation: "strong_yes", comment: null });
    expect(unknown.success).toBe(false);
  });
});
