import { HttpError, type FieldErrors } from "../lib/http-error.ts";
import {
  EXCLUSION_VIOLATION,
  FOREIGN_KEY_VIOLATION,
  findPgError,
} from "../lib/pg-error.ts";
import * as repository from "./repository.ts";
import type { Meeting, MeetingStatus } from "./repository.ts";
import type {
  CreateMeetingBody,
  ListMeetingsQuery,
  UpdateMeetingBody,
} from "./schemas.ts";

export const OVERLAP_MESSAGE =
  "This time overlaps an existing meeting. Choose another time.";
const IN_HISTORY_MESSAGE =
  "This meeting is completed or cancelled, so it can't be changed.";

// The only status moves; anything else is refused.
const MOVES = {
  confirm: {
    from: ["pending"],
    to: "confirmed",
    refused: "Only a pending meeting can be confirmed.",
  },
  cancel: {
    from: ["pending", "confirmed"],
    to: "cancelled",
    refused: "Only a pending or confirmed meeting can be cancelled.",
  },
  complete: {
    from: ["confirmed"],
    to: "completed",
    refused: "Confirm the meeting before marking it completed.",
  },
} satisfies Record<
  string,
  { from: MeetingStatus[]; to: MeetingStatus; refused: string }
>;
export type StatusMove = keyof typeof MOVES;

export async function listMeetings(
  ownerId: string,
  query: ListMeetingsQuery,
  now = new Date(),
) {
  const { page, pageSize, q, status, position, to } = query;
  // With no start date, the dashboard shows meetings from now on.
  const from = query.from ?? now;
  const { meetings, total } = await repository.listMeetings(ownerId, {
    from,
    to,
    q,
    status,
    positionId: position,
    page,
    pageSize,
  });
  return {
    meetings,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMeeting(ownerId: string, id: string) {
  const meeting = await repository.findMeeting(ownerId, id);
  if (!meeting) {
    throw new HttpError(404, "Not found");
  }
  return meeting;
}

export async function createMeeting(
  ownerId: string,
  body: CreateMeetingBody,
  now = new Date(),
) {
  const errors = ruleErrors(body);
  if (body.startAt <= now) {
    errors.startAt = ["Start time must be later than now."];
  }
  throwIfAny(errors);

  const { candidateId, candidateName, ...fields } = body;
  // The schema lets exactly one of the two through.
  const candidate =
    candidateName === undefined
      ? { candidateId: String(candidateId) }
      : { candidateName };
  const id = await refuseConflicts(() =>
    repository.insertMeeting(ownerId, { ...fields, ...candidate }),
  );
  return getMeeting(ownerId, id);
}

// A meeting that has passed keeps its time, so it can still be completed.
export async function updateMeeting(
  ownerId: string,
  id: string,
  changes: UpdateMeetingBody,
) {
  const current = await getOpenMeeting(ownerId, id);
  throwIfAny(
    ruleErrors({
      startAt: changes.startAt ?? current.startAt,
      endAt: changes.endAt ?? current.endAt,
      type: changes.type ?? current.type,
      platform:
        changes.platform === undefined ? current.platform : changes.platform,
    }),
  );

  const updated = await refuseConflicts(() =>
    repository.updateOpenMeeting(ownerId, id, changes),
  );
  if (!updated) {
    // Completed or cancelled between the read and the write.
    throw new HttpError(409, IN_HISTORY_MESSAGE);
  }
  return getMeeting(ownerId, id);
}

export async function deleteMeeting(ownerId: string, id: string) {
  await getOpenMeeting(ownerId, id);
  if (!(await repository.deleteOpenMeeting(ownerId, id))) {
    throw new HttpError(409, IN_HISTORY_MESSAGE);
  }
}

export async function moveStatus(
  ownerId: string,
  id: string,
  move: StatusMove,
  now = new Date(),
) {
  const { from, to, refused } = MOVES[move];
  const current = await getMeeting(ownerId, id);
  if (!(from as MeetingStatus[]).includes(current.status)) {
    throw new HttpError(409, refused);
  }
  // A meeting can run late, so it is completed by hand, never before it starts.
  if (move === "complete" && current.startAt > now) {
    throw new HttpError(409, "A meeting can be completed once it has started.");
  }
  if (!(await repository.setStatus(ownerId, id, from, to))) {
    throw new HttpError(409, refused);
  }
  return getMeeting(ownerId, id);
}

async function getOpenMeeting(ownerId: string, id: string) {
  const meeting = await getMeeting(ownerId, id);
  if (!repository.OPEN_STATUSES.includes(meeting.status)) {
    throw new HttpError(409, IN_HISTORY_MESSAGE);
  }
  return meeting;
}

// The database checks the same rules; these give the form its messages.
function ruleErrors(
  meeting: Pick<Meeting, "startAt" | "endAt" | "type" | "platform">,
) {
  const errors: FieldErrors = {};
  if (meeting.endAt <= meeting.startAt) {
    errors.endAt = ["End time must be after start time."];
  }
  if (meeting.type === "online" && meeting.platform === null) {
    errors.platform = ["Choose a platform."];
  }
  if (meeting.type === "on_site" && meeting.platform !== null) {
    errors.platform = ["An onsite meeting has no platform."];
  }
  return errors;
}

function throwIfAny(errors: FieldErrors) {
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Check the fields and try again.", errors);
  }
}

// Turns what only the database can catch into answers for the form.
async function refuseConflicts<T>(write: () => Promise<T>) {
  try {
    return await write();
  } catch (err) {
    const pgError = findPgError(err);
    // Another meeting was booked at this time since the form loaded its list.
    if (pgError?.code === EXCLUSION_VIOLATION) {
      throw new HttpError(409, OVERLAP_MESSAGE, { startAt: [OVERLAP_MESSAGE] });
    }
    // The candidate or position does not exist, or the candidate belongs to
    // another user (meeting's foreign key to candidate (id, owner_id)).
    if (pgError?.code === FOREIGN_KEY_VIOLATION) {
      throw new HttpError(400, "Check the fields and try again.", {
        [pgError.constraint?.includes("position")
          ? "positionId"
          : "candidateId"]: ["Pick one from the list."],
      });
    }
    throw err;
  }
}
