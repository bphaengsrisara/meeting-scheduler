import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  gt,
  inArray,
  lt,
  ne,
  sql,
} from "drizzle-orm";
import { db } from "../db/client.ts";
import { candidate, feedback, meeting, position } from "../db/schema/app.ts";
import { containsPattern } from "../lib/like.ts";

export type MeetingStatus = (typeof meeting.$inferSelect)["status"];
type MeetingFields = Pick<
  typeof meeting.$inferInsert,
  "positionId" | "startAt" | "endAt" | "type" | "platform" | "notes"
>;
// An edit can also set the status back to pending (a confirmed time moved).
type MeetingChanges = Partial<
  MeetingFields & Pick<typeof meeting.$inferInsert, "status">
>;
type FeedbackFields = Pick<
  typeof feedback.$inferInsert,
  "recommendation" | "comment"
>;
export type NewMeeting = Required<MeetingFields> &
  ({ candidateId: string } | { candidateName: string; candidateEmail: string });
export type MeetingFilters = {
  from: Date;
  to?: Date;
  q?: string;
  status?: MeetingStatus;
  positionId?: string;
  page: number;
  pageSize: number;
};

// Pending and confirmed meetings can still change; completed and cancelled
// ones are History and are never edited or deleted.
export const OPEN_STATUSES: MeetingStatus[] = ["pending", "confirmed"];

// Edit and delete only touch an open meeting that has not started; a
// started one is part of the record, so only its status can still move.
const notStartedOpen = () =>
  and(inArray(meeting.status, OPEN_STATUSES), gt(meeting.startAt, sql`now()`));

// One meeting as the API returns it, with its candidate, position and
// feedback (null until a completed meeting gets one).
function selectMeetings() {
  return db
    .select({
      id: meeting.id,
      startAt: meeting.startAt,
      endAt: meeting.endAt,
      type: meeting.type,
      platform: meeting.platform,
      status: meeting.status,
      notes: meeting.notes,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      },
      position: { id: position.id, name: position.name },
      feedback: {
        recommendation: feedback.recommendation,
        comment: feedback.comment,
        updatedAt: feedback.updatedAt,
      },
    })
    .from(meeting)
    .innerJoin(candidate, eq(candidate.id, meeting.candidateId))
    .innerJoin(position, eq(position.id, meeting.positionId))
    .leftJoin(feedback, eq(feedback.meetingId, meeting.id));
}

export type Meeting = Awaited<ReturnType<typeof selectMeetings>>[number];

const ownedBy = (ownerId: string, id: string) =>
  and(eq(meeting.id, id), eq(meeting.ownerId, ownerId));

export async function listMeetings(ownerId: string, filters: MeetingFilters) {
  const { from, to, q, status, positionId } = filters;
  const where = and(
    eq(meeting.ownerId, ownerId),
    gte(meeting.startAt, from),
    to ? lt(meeting.startAt, to) : undefined,
    // Cancelled meetings show only when asked for.
    status ? eq(meeting.status, status) : ne(meeting.status, "cancelled"),
    positionId ? eq(meeting.positionId, positionId) : undefined,
    q ? ilike(candidate.name, containsPattern(q)) : undefined,
  );

  const [meetings, [{ total }]] = await Promise.all([
    selectMeetings()
      .where(where)
      .orderBy(asc(meeting.startAt), asc(meeting.id))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    db
      .select({ total: count() })
      .from(meeting)
      .innerJoin(candidate, eq(candidate.id, meeting.candidateId))
      .where(where),
  ]);
  return { meetings, total };
}

export async function findMeeting(
  ownerId: string,
  id: string,
): Promise<Meeting | undefined> {
  const [found] = await selectMeetings().where(ownedBy(ownerId, id));
  return found;
}

// Every meeting of one candidate, earliest first.
export function listCandidateMeetings(ownerId: string, candidateId: string) {
  return selectMeetings()
    .where(
      and(eq(meeting.ownerId, ownerId), eq(meeting.candidateId, candidateId)),
    )
    .orderBy(asc(meeting.startAt), asc(meeting.id));
}

// A new candidate, when there is one, is added in the same transaction, so a
// refused meeting leaves no candidate behind.
export async function insertMeeting(ownerId: string, input: NewMeeting) {
  return db.transaction(async (tx) => {
    let candidateId: string;
    if ("candidateName" in input) {
      const [added] = await tx
        .insert(candidate)
        .values({
          ownerId,
          name: input.candidateName,
          email: input.candidateEmail,
        })
        .returning({ id: candidate.id });
      candidateId = added.id;
    } else {
      candidateId = input.candidateId;
    }
    const { positionId, startAt, endAt, type, platform, notes } = input;
    const [created] = await tx
      .insert(meeting)
      .values({
        ownerId,
        candidateId,
        positionId,
        startAt,
        endAt,
        type,
        platform,
        notes,
      })
      .returning({ id: meeting.id });
    return created.id;
  });
}

// Changes only an open meeting not yet started; false when none matched.
export async function updateOpenMeeting(
  ownerId: string,
  id: string,
  changes: MeetingChanges,
) {
  const updated = await db
    .update(meeting)
    .set(changes)
    .where(and(ownedBy(ownerId, id), notStartedOpen()))
    .returning({ id: meeting.id });
  return updated.length > 0;
}

export async function deleteOpenMeeting(ownerId: string, id: string) {
  const deleted = await db
    .delete(meeting)
    .where(and(ownedBy(ownerId, id), notStartedOpen()))
    .returning({ id: meeting.id });
  return deleted.length > 0;
}

// Moves the status only from one of the given statuses, so two requests at
// once cannot both move it.
export async function setStatus(
  ownerId: string,
  id: string,
  from: MeetingStatus[],
  to: MeetingStatus,
) {
  const updated = await db
    .update(meeting)
    .set({ status: to })
    .where(and(ownedBy(ownerId, id), inArray(meeting.status, from)))
    .returning({ id: meeting.id });
  return updated.length > 0;
}

// A meeting has at most one feedback, so saving again replaces it.
export async function saveFeedback(meetingId: string, fields: FeedbackFields) {
  await db
    .insert(feedback)
    .values({ meetingId, ...fields })
    .onConflictDoUpdate({
      target: feedback.meetingId,
      set: { ...fields, updatedAt: sql`now()` },
    });
}
