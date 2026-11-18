import { HttpError } from "../lib/http-error.ts";
import {
  listCandidateMeetings,
  OPEN_STATUSES,
} from "../meetings/repository.ts";
import * as repository from "./repository.ts";
import type { UpdateCandidateBody } from "./schemas.ts";

// The candidate, open meetings earliest first, History newest first. Split
// by status, not time: a started meeting not yet marked stays upcoming,
// where Mark Completed is.
export async function getCandidatePage(ownerId: string, id: string) {
  const candidate = await repository.findCandidate(ownerId, id);
  if (!candidate) {
    throw new HttpError(404, "Not found");
  }
  const meetings = await listCandidateMeetings(ownerId, id);
  return {
    candidate,
    upcoming: meetings.filter((m) => OPEN_STATUSES.includes(m.status)),
    history: meetings
      .filter((m) => !OPEN_STATUSES.includes(m.status))
      .reverse(),
  };
}

export const EMAIL_TAKEN_MESSAGE = "Another candidate already has this email.";

export async function updateCandidate(
  ownerId: string,
  id: string,
  changes: UpdateCandidateBody,
) {
  const candidate = await repository
    .updateCandidate(ownerId, id, changes)
    .catch((err: unknown) => {
      if (repository.isEmailTaken(err)) {
        throw new HttpError(409, EMAIL_TAKEN_MESSAGE, {
          email: [EMAIL_TAKEN_MESSAGE],
        });
      }
      throw err;
    });
  if (!candidate) {
    throw new HttpError(404, "Not found");
  }
  return candidate;
}
