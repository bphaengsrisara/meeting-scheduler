import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { candidate, meeting } from "../db/schema/app.ts";
import { containsPattern } from "../lib/like.ts";

const SUGGESTIONS = 10;

// The booking form's autocomplete. Each candidate comes with the position of
// their latest meeting, which the form picks for the new booking.
export function searchCandidates(ownerId: string, q: string) {
  const latestPositionId = db
    .select({ positionId: meeting.positionId })
    .from(meeting)
    .where(eq(meeting.candidateId, candidate.id))
    .orderBy(desc(meeting.startAt))
    .limit(1);

  return db
    .select({
      id: candidate.id,
      name: candidate.name,
      latestPositionId: sql<string | null>`(${latestPositionId})`,
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
