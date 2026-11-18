import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/client.ts";
import {
  candidate,
  CANDIDATE_EMAIL_UNIQUE,
  meeting,
} from "../db/schema/app.ts";
import { containsPattern } from "../lib/like.ts";
import { findPgError, UNIQUE_VIOLATION } from "../lib/pg-error.ts";
import type { UpdateCandidateBody } from "./schemas.ts";

const SUGGESTIONS = 10;

// The database refused a write because the account already has a candidate
// with this email.
export function isEmailTaken(err: unknown) {
  const pgError = findPgError(err);
  return (
    pgError?.code === UNIQUE_VIOLATION &&
    pgError.constraint === CANDIDATE_EMAIL_UNIQUE
  );
}

// The booking form's autocomplete, matching the name or the email. Each
// candidate comes with the position and start of their latest meeting: the
// form picks that position for the new booking.
export function searchCandidates(ownerId: string, q: string) {
  // One column of the candidate's latest meeting, read as that column's
  // type (mapWith), so the start comes back as a Date.
  const latest = <T extends AnyPgColumn>(column: T) =>
    sql<T["_"]["data"] | null>`(${db
      .select({ value: column })
      .from(meeting)
      .where(eq(meeting.candidateId, candidate.id))
      .orderBy(desc(meeting.startAt))
      .limit(1)})`.mapWith(column);

  return db
    .select({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      latestPositionId: latest(meeting.positionId),
      latestStartAt: latest(meeting.startAt),
    })
    .from(candidate)
    .where(
      and(
        eq(candidate.ownerId, ownerId),
        q
          ? or(
              ilike(candidate.name, containsPattern(q)),
              ilike(candidate.email, containsPattern(q)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(candidate.name))
    .limit(SUGGESTIONS);
}

const candidateFields = {
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  notes: candidate.notes,
};
type Candidate = {
  id: string;
  name: string;
  email: string;
  notes: string | null;
};
const ownedBy = (ownerId: string, id: string) =>
  and(eq(candidate.id, id), eq(candidate.ownerId, ownerId));

export async function findCandidate(
  ownerId: string,
  id: string,
): Promise<Candidate | undefined> {
  const [found] = await db
    .select(candidateFields)
    .from(candidate)
    .where(ownedBy(ownerId, id));
  return found;
}

// The updated candidate, or undefined when none of the user's matched.
export async function updateCandidate(
  ownerId: string,
  id: string,
  changes: UpdateCandidateBody,
): Promise<Candidate | undefined> {
  const [updated] = await db
    .update(candidate)
    .set(changes)
    .where(ownedBy(ownerId, id))
    .returning(candidateFields);
  return updated;
}

// When a guest signs up or logs in, their candidates move to the account.
// Their meetings follow through the foreign key's ON UPDATE CASCADE.
export async function moveCandidates(fromOwnerId: string, toOwnerId: string) {
  await db
    .update(candidate)
    .set({ ownerId: toOwnerId })
    .where(eq(candidate.ownerId, fromOwnerId));
}
