import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../lib/http-error.ts";
import * as repository from "./repository.ts";
import type { Meeting } from "./repository.ts";
import * as service from "./service.ts";

// The database is mocked: these tests cover the service's rules only.
vi.mock("./repository.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./repository.ts")>()),
  listMeetings: vi.fn(),
  findMeeting: vi.fn(),
  insertMeeting: vi.fn(),
  updateOpenMeeting: vi.fn(),
  deleteOpenMeeting: vi.fn(),
  setStatus: vi.fn(),
  saveFeedback: vi.fn(),
}));

const owner = "01a1ec1c-0000-7000-8000-000000000001";
const now = new Date("2026-11-18T03:00:00Z");
const hoursFromNow = (hours: number) =>
  new Date(now.getTime() + hours * 60 * 60 * 1000);

const stored: Meeting = {
  id: "01a1ec1c-0000-7000-8000-000000000002",
  startAt: hoursFromNow(24),
  endAt: hoursFromNow(25),
  type: "online",
  platform: "zoom",
  status: "pending",
  notes: null,
  candidate: { id: "01a1ec1c-0000-7000-8000-000000000003", name: "Jane Doe" },
  position: { id: "01a1ec1c-0000-7000-8000-000000000004", name: "QA Engineer" },
  feedback: null,
};

const newBooking = {
  candidateName: "Jane Doe",
  positionId: stored.position.id,
  startAt: hoursFromNow(24),
  endAt: hoursFromNow(25),
  type: "on_site" as const,
  platform: null,
  notes: null,
};

// What a refused query looks like: Drizzle's error with PostgreSQL's as cause.
const dbError = (code: string, constraint: string) =>
  new Error("Failed query", {
    cause: Object.assign(new Error(), { code, constraint }),
  });

// Runs the call and returns the HttpError it threw.
async function refusal(call: Promise<unknown>) {
  const error = await call.then(
    () => undefined,
    (err: unknown) => err,
  );
  expect(error).toBeInstanceOf(HttpError);
  return error as HttpError;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repository.findMeeting).mockResolvedValue(stored);
});

describe("listMeetings", () => {
  it("starts from now when no start date is given", async () => {
    vi.mocked(repository.listMeetings).mockResolvedValue({
      meetings: [],
      total: 21,
    });

    const result = await service.listMeetings(
      owner,
      { page: 2, pageSize: 10 },
      now,
    );

    expect(repository.listMeetings).toHaveBeenCalledWith(
      owner,
      expect.objectContaining({ from: now, page: 2, pageSize: 10 }),
    );
    expect(result).toMatchObject({ page: 2, total: 21, totalPages: 3 });
  });
});

describe("createMeeting", () => {
  it("adds a new candidate with the meeting", async () => {
    vi.mocked(repository.insertMeeting).mockResolvedValue(stored.id);

    await service.createMeeting(owner, newBooking, now);

    expect(repository.insertMeeting).toHaveBeenCalledWith(
      owner,
      expect.objectContaining({ candidateName: "Jane Doe" }),
    );
  });

  it("refuses a start time that is not later than now", async () => {
    const error = await refusal(
      service.createMeeting(owner, { ...newBooking, startAt: now }, now),
    );

    expect(error.status).toBe(400);
    expect(error.fields?.startAt).toEqual([
      "Start time must be later than now.",
    ]);
    expect(repository.insertMeeting).not.toHaveBeenCalled();
  });

  it("refuses an end time that is not after the start", async () => {
    const error = await refusal(
      service.createMeeting(
        owner,
        { ...newBooking, endAt: newBooking.startAt },
        now,
      ),
    );

    expect(error.fields?.endAt).toEqual(["End time must be after start time."]);
  });

  it("needs a platform for an online meeting and none for an onsite one", async () => {
    const online = await refusal(
      service.createMeeting(owner, { ...newBooking, type: "online" }, now),
    );
    const onsite = await refusal(
      service.createMeeting(owner, { ...newBooking, platform: "zoom" }, now),
    );

    expect(online.fields?.platform).toEqual(["Choose a platform."]);
    expect(onsite.fields?.platform).toEqual([
      "An onsite meeting has no platform.",
    ]);
  });

  it("answers 409 under the times when the database finds an overlap", async () => {
    vi.mocked(repository.insertMeeting).mockRejectedValue(
      dbError("23P01", "meeting_no_overlap"),
    );

    const error = await refusal(service.createMeeting(owner, newBooking, now));

    expect(error.status).toBe(409);
    expect(error.fields?.startAt).toEqual([service.OVERLAP_MESSAGE]);
  });

  it("answers 400 for a candidate that is not the user's", async () => {
    vi.mocked(repository.insertMeeting).mockRejectedValue(
      dbError("23503", "meeting_candidate_owner_fk"),
    );

    const error = await refusal(
      service.createMeeting(
        owner,
        {
          ...newBooking,
          candidateName: undefined,
          candidateId: stored.candidate.id,
        },
        now,
      ),
    );

    expect(error.status).toBe(400);
    expect(error.fields).toHaveProperty("candidateId");
  });
});

describe("updateMeeting", () => {
  it("checks the rules on the stored meeting merged with the changes", async () => {
    // Only the end changes; it would be before the stored start.
    const error = await refusal(
      service.updateMeeting(owner, stored.id, { endAt: hoursFromNow(23) }),
    );

    expect(error.fields?.endAt).toEqual(["End time must be after start time."]);
    expect(repository.updateOpenMeeting).not.toHaveBeenCalled();
  });

  it("refuses a meeting in History", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "completed",
    });

    const error = await refusal(
      service.updateMeeting(owner, stored.id, { notes: "x" }),
    );

    expect(error.status).toBe(409);
  });

  it("answers 404 for a meeting that is not the user's", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue(undefined);

    const error = await refusal(
      service.updateMeeting(owner, stored.id, { notes: "x" }),
    );

    expect(error.status).toBe(404);
  });
});

describe("deleteMeeting", () => {
  it("deletes an open meeting", async () => {
    vi.mocked(repository.deleteOpenMeeting).mockResolvedValue(true);

    await service.deleteMeeting(owner, stored.id);

    expect(repository.deleteOpenMeeting).toHaveBeenCalledWith(owner, stored.id);
  });

  it("refuses a cancelled meeting", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "cancelled",
    });

    const error = await refusal(service.deleteMeeting(owner, stored.id));

    expect(error.status).toBe(409);
    expect(repository.deleteOpenMeeting).not.toHaveBeenCalled();
  });
});

describe("moveStatus", () => {
  it("confirms a pending meeting", async () => {
    vi.mocked(repository.setStatus).mockResolvedValue(true);

    await service.moveStatus(owner, stored.id, "confirm", now);

    expect(repository.setStatus).toHaveBeenCalledWith(
      owner,
      stored.id,
      ["pending"],
      "confirmed",
    );
  });

  it("completes a confirmed meeting once it has started", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "confirmed",
      startAt: hoursFromNow(-1),
    });
    vi.mocked(repository.setStatus).mockResolvedValue(true);

    await service.moveStatus(owner, stored.id, "complete", now);

    expect(repository.setStatus).toHaveBeenCalledWith(
      owner,
      stored.id,
      ["confirmed"],
      "completed",
    );
  });

  it("refuses to complete a meeting that has not started", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "confirmed",
    });

    const error = await refusal(
      service.moveStatus(owner, stored.id, "complete", now),
    );

    expect(error.status).toBe(409);
    expect(repository.setStatus).not.toHaveBeenCalled();
  });

  it("refuses to complete a pending meeting: confirm comes first", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      startAt: hoursFromNow(-1),
    });

    const error = await refusal(
      service.moveStatus(owner, stored.id, "complete", now),
    );

    expect(error.message).toBe(
      "Confirm the meeting before marking it completed.",
    );
  });

  it("refuses to cancel a completed meeting", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "completed",
    });

    const error = await refusal(
      service.moveStatus(owner, stored.id, "cancel", now),
    );

    expect(error.status).toBe(409);
  });

  it("refuses when another request moved the status first", async () => {
    vi.mocked(repository.setStatus).mockResolvedValue(false);

    const error = await refusal(
      service.moveStatus(owner, stored.id, "confirm", now),
    );

    expect(error.status).toBe(409);
  });
});

describe("saveFeedback", () => {
  const review = { recommendation: "yes" as const, comment: "Clear answers." };

  it("saves the feedback of a completed meeting", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue({
      ...stored,
      status: "completed",
    });

    await service.saveFeedback(owner, stored.id, review);

    expect(repository.saveFeedback).toHaveBeenCalledWith(stored.id, review);
  });

  it.each(["pending", "confirmed", "cancelled"] as const)(
    "refuses feedback on a %s meeting",
    async (status) => {
      vi.mocked(repository.findMeeting).mockResolvedValue({
        ...stored,
        status,
      });

      const error = await refusal(
        service.saveFeedback(owner, stored.id, review),
      );

      expect(error.status).toBe(409);
      expect(repository.saveFeedback).not.toHaveBeenCalled();
    },
  );

  it("answers 404 for a meeting that is not the user's", async () => {
    vi.mocked(repository.findMeeting).mockResolvedValue(undefined);

    const error = await refusal(service.saveFeedback(owner, stored.id, review));

    expect(error.status).toBe(404);
  });
});
