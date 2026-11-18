import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../lib/http-error.ts";
import * as meetings from "../meetings/repository.ts";
import type { Meeting, MeetingStatus } from "../meetings/repository.ts";
import * as repository from "./repository.ts";
import * as service from "./service.ts";

// The database is mocked: these tests cover the service's rules only.
vi.mock("./repository.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./repository.ts")>()),
  findCandidate: vi.fn(),
  updateCandidate: vi.fn(),
}));
vi.mock("../meetings/repository.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../meetings/repository.ts")>()),
  listCandidateMeetings: vi.fn(),
}));

const owner = "01a1ec1c-0000-7000-8000-000000000001";
const stored = {
  id: "01a1ec1c-0000-7000-8000-000000000003",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  notes: null,
};

// A meeting of the candidate, by its day in November 2026 and its status.
const meetingOn = (day: number, status: MeetingStatus): Meeting => ({
  id: `01a1ec1c-0000-7000-8000-0000000001${String(day).padStart(2, "0")}`,
  startAt: new Date(`2026-11-${day}T03:00:00Z`),
  endAt: new Date(`2026-11-${day}T04:00:00Z`),
  type: "on_site",
  platform: null,
  status,
  notes: null,
  candidate: { id: stored.id, name: stored.name, email: stored.email },
  position: { id: "01a1ec1c-0000-7000-8000-000000000004", name: "QA Engineer" },
  feedback: null,
});

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
});

describe("getCandidatePage", () => {
  it("splits the meetings by status: upcoming earliest first, History newest first", async () => {
    vi.mocked(repository.findCandidate).mockResolvedValue(stored);
    // Earliest first, as the repository returns them.
    vi.mocked(meetings.listCandidateMeetings).mockResolvedValue([
      meetingOn(10, "completed"),
      meetingOn(12, "cancelled"),
      meetingOn(16, "confirmed"),
      meetingOn(20, "pending"),
      meetingOn(24, "pending"),
    ]);

    const page = await service.getCandidatePage(owner, stored.id);

    const days = (list: Meeting[]) => list.map((m) => m.startAt.getUTCDate());
    expect(page.candidate).toEqual(stored);
    // The 16th has started but is not marked, so it stays upcoming.
    expect(days(page.upcoming)).toEqual([16, 20, 24]);
    expect(days(page.history)).toEqual([12, 10]);
  });

  it("answers 404 for a candidate that is not the user's", async () => {
    vi.mocked(repository.findCandidate).mockResolvedValue(undefined);

    const error = await refusal(service.getCandidatePage(owner, stored.id));

    expect(error.status).toBe(404);
    expect(meetings.listCandidateMeetings).not.toHaveBeenCalled();
  });
});

describe("updateCandidate", () => {
  it("returns the updated candidate", async () => {
    const renamed = { ...stored, name: "Jane Smith" };
    vi.mocked(repository.updateCandidate).mockResolvedValue(renamed);

    const result = await service.updateCandidate(owner, stored.id, {
      name: "Jane Smith",
    });

    expect(result).toEqual(renamed);
  });

  it("answers 409 when another of the user's candidates has the email", async () => {
    vi.mocked(repository.updateCandidate).mockRejectedValue(
      new Error("Failed query", {
        cause: Object.assign(new Error(), {
          code: "23505",
          constraint: "candidate_owner_id_email_unique",
        }),
      }),
    );

    const error = await refusal(
      service.updateCandidate(owner, stored.id, {
        name: "Jane Doe",
        email: "taken@example.com",
      }),
    );

    expect(error.status).toBe(409);
    expect(error.fields?.email).toEqual([service.EMAIL_TAKEN_MESSAGE]);
  });

  it("answers 404 when none of the user's candidates matched", async () => {
    vi.mocked(repository.updateCandidate).mockResolvedValue(undefined);

    const error = await refusal(
      service.updateCandidate(owner, stored.id, { notes: null }),
    );

    expect(error.status).toBe(404);
  });
});
