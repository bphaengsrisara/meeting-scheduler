import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/client.ts";
import { candidate, meeting } from "../db/schema/app.ts";
import { containsPattern } from "../lib/like.ts";
import type { UpdateCandidateBody } from "./schemas.ts";

const SUGGESTIONS = 10;

// The booking form's autocomplete. Each candidate comes with the position
// and start of their latest meeting: the form picks that position for the
// new booking, and the date tells apart two candidates with the same name.
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
      latestPositionId: latest(meeting.positionId),
      latestStartAt: latest(meeting.startAt),
    })
    .from(candidate)
    .where(
      and(
        eq(candidate.ownerId, ownerId),
        q ? ilike(candidate.name, containsPattern(q)) : undefined,
      ),
    )
    .orderBy(asc(candidate.name))
    .limit(SUGGESTIONS);
}

const candidateFields = {
  id: candidate.id,
  name: candidate.name,
  notes: candidate.notes,
};
type Candidate = { id: string; name: string; notes: string | null };
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
