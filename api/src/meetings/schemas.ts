import { z } from "zod";
import { candidateName, NAME_MAX } from "../candidates/schemas.ts";
import {
  meetingPlatform,
  meetingStatus,
  meetingType,
} from "../db/schema/app.ts";

export const NOTES_MAX = 2000;

// An ISO 8601 date and time with its offset, e.g. 2026-11-18T03:00:00Z.
const dateTime = z.iso
  .datetime({ offset: true, error: "Enter a date and time." })
  .transform((value) => new Date(value));

const notes = z
  .string()
  .trim()
  .max(NOTES_MAX, `Use ${NOTES_MAX} characters or fewer.`)
  .transform((value) => value || null)
  .nullable();

// Rules across fields (end after start, platform only when online) are
// checked by the service, after an edit is merged with the stored meeting.
const meetingFields = {
  positionId: z.uuid("Choose a position."),
  startAt: dateTime,
  endAt: dateTime,
  type: z.enum(meetingType.enumValues, "Choose the meeting type."),
  platform: z.enum(meetingPlatform.enumValues, "Choose a platform.").nullable(),
  notes,
};

// Either an existing candidate's id or a new candidate's name.
export const createMeetingBody = z
  .object({
    ...meetingFields,
    platform: meetingFields.platform.default(null),
    notes: notes.default(null),
    candidateId: z.uuid().optional(),
    candidateName: candidateName.optional(),
  })
  .refine(
    (body) =>
      (body.candidateId === undefined) !== (body.candidateName === undefined),
    { message: "Pick a candidate or add a new one.", path: ["candidateName"] },
  );

// The candidate of a meeting cannot change; only these fields can.
export const updateMeetingBody = z
  .object(meetingFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change.");

export const listMeetingsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // 10 a page by default; up to 100 for the booking form's list of a day.
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(NAME_MAX).optional(),
  status: z.enum(meetingStatus.enumValues).optional(),
  position: z.uuid().optional(),
  // Start times from (inclusive) and to (exclusive).
  from: dateTime.optional(),
  to: dateTime.optional(),
});

export const meetingIdParams = z.object({ id: z.uuid() });

export type CreateMeetingBody = z.infer<typeof createMeetingBody>;
export type UpdateMeetingBody = z.infer<typeof updateMeetingBody>;
export type ListMeetingsQuery = z.infer<typeof listMeetingsQuery>;
