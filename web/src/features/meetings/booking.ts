import { z } from "zod";
import { dayAndTimeIn, formatTime, instantIn } from "@/lib/dates";
import type { Meeting } from "./types";

// The API's limits (the same numbers as its schemas).
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const NOTES_MAX = 2000;

// A candidate's email, as the API checks it.
export const candidateEmailSchema = z
  .string()
  .trim()
  .min(1, "Enter the candidate's email.")
  .max(EMAIL_MAX, `Use ${EMAIL_MAX} characters or fewer.`)
  .pipe(z.email("Enter a valid email address."));

// The booking form's fields as typed. Date and times stay text ("2026-11-20",
// "14:30") until they are sent; they are read in the user's time zone.
export const meetingFormSchema = z
  .object({
    // Empty for a new candidate: the name is then created with the meeting.
    candidateId: z.string(),
    candidateName: z
      .string()
      .trim()
      .min(1, "Enter the candidate's name.")
      .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`),
    // Only a new candidate has one to type; checked below.
    candidateEmail: z.string().trim(),
    positionId: z.string().min(1, "Choose a position."),
    date: z.string().min(1, "Choose a date."),
    startTime: z.string().min(1, "Enter a start time."),
    endTime: z.string().min(1, "Enter an end time."),
    // Empty until chosen: the radios start with nothing picked.
    type: z.enum(["on_site", "online"]).or(z.literal("")),
    platform: z.enum(["zoom", "google_meet"]).or(z.literal("")),
    notes: z
      .string()
      .trim()
      .max(NOTES_MAX, `Use ${NOTES_MAX} characters or fewer.`),
  })
  .superRefine((values, ctx) => {
    if (!values.candidateId) {
      const email = candidateEmailSchema.safeParse(values.candidateEmail);
      if (!email.success) {
        ctx.addIssue({
          code: "custom",
          path: ["candidateEmail"],
          message: email.error.issues[0].message,
        });
      }
    }
    if (!values.type) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "Choose the meeting type.",
      });
    }
    // "HH:mm" text compares in time order.
    if (
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
    if (values.type === "online" && !values.platform) {
      ctx.addIssue({
        code: "custom",
        path: ["platform"],
        message: "Choose a platform.",
      });
    }
  });

export type MeetingFormInput = z.input<typeof meetingFormSchema>;
export type MeetingFormValues = z.output<typeof meetingFormSchema>;

export const emptyMeetingForm: MeetingFormInput = {
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  positionId: "",
  date: "",
  startTime: "",
  endTime: "",
  type: "",
  platform: "",
  notes: "",
};

// An edited meeting's values, with its times in the user's time zone.
export function meetingToForm(
  meeting: Meeting,
  zone: string,
): MeetingFormInput {
  const start = dayAndTimeIn(new Date(meeting.startAt), zone);
  const end = dayAndTimeIn(new Date(meeting.endAt), zone);
  return {
    candidateId: meeting.candidate.id,
    candidateName: meeting.candidate.name,
    candidateEmail: "",
    positionId: meeting.position.id,
    date: start.day,
    startTime: start.time,
    endTime: end.time,
    type: meeting.type,
    platform: meeting.platform ?? "",
    notes: meeting.notes ?? "",
  };
}

export function meetingTimes(
  values: Pick<MeetingFormInput, "date" | "startTime" | "endTime">,
  zone: string,
) {
  return {
    start: instantIn(values.date, values.startTime, zone),
    end: instantIn(values.date, values.endTime, zone),
  };
}

// What the API's PATCH /meetings/:id takes.
export function toMeetingChanges(values: MeetingFormValues, zone: string) {
  const { start, end } = meetingTimes(values, zone);
  return {
    positionId: values.positionId,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    type: values.type,
    // Onsite has no platform; the API refuses one.
    platform: values.type === "online" ? values.platform || null : null,
    notes: values.notes || null,
  };
}

// What the API's POST /meetings takes: an existing candidate's id, or a new
// candidate's name and email.
export function toNewMeeting(values: MeetingFormValues, zone: string) {
  const candidate = values.candidateId
    ? { candidateId: values.candidateId }
    : {
        candidateName: values.candidateName,
        candidateEmail: values.candidateEmail,
      };
  return { ...toMeetingChanges(values, zone), ...candidate };
}

export type MeetingBody =
  ReturnType<typeof toNewMeeting> | ReturnType<typeof toMeetingChanges>;

// Picking a start time with no end time yet fills the end an hour later
// (a common interview length; still editable). Not past midnight: a meeting
// ends on its own day.
const DEFAULT_LENGTH_MINUTES = 60;
const MINUTES_IN_DAY = 24 * 60;

export function defaultEndTime(startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const end = hours * 60 + minutes + DEFAULT_LENGTH_MINUTES;
  if (Number.isNaN(end) || end >= MINUTES_IN_DAY) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

// Two meetings overlap when each starts before the other ends; back to back
// is fine, the same rule as the database's [start, end) ranges. Only
// meetings still to happen hold their time; completed ones are over.
export function overlaps(
  a: { start: Date; end: Date },
  b: Pick<Meeting, "startAt" | "endAt" | "status">,
) {
  const holdsTime = b.status === "pending" || b.status === "confirmed";
  return (
    holdsTime && a.start < new Date(b.endAt) && new Date(b.startAt) < a.end
  );
}

// The message under the times when the picked times overlap a meeting in
// the day's list (Book Meeting then sends nothing).
export function overlapMessage(
  other: { startAt: string; endAt: string; candidate: { name: string } },
  zone: string,
) {
  const start = formatTime(new Date(other.startAt), zone);
  const end = formatTime(new Date(other.endAt), zone);
  return `This time overlaps your meeting with ${other.candidate.name} (${start} – ${end}). Choose a time that doesn't overlap it.`;
}

// The API's field names and the form's: the form has one box for the
// candidate and splits each time into a date and a clock time.
const FORM_FIELDS: Record<string, keyof MeetingFormInput> = {
  candidateId: "candidateName",
  candidateName: "candidateName",
  candidateEmail: "candidateEmail",
  positionId: "positionId",
  startAt: "startTime",
  endAt: "endTime",
  type: "type",
  platform: "platform",
  notes: "notes",
};

export function toFormErrors(fields: Record<string, string[]> = {}) {
  return Object.entries(fields).flatMap(([field, messages]) => {
    const name = FORM_FIELDS[field];
    return name && messages[0] ? [{ name, message: messages[0] }] : [];
  });
}
