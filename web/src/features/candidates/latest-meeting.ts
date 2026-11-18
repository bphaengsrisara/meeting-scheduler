import type { Meeting } from "@/features/meetings/types";

// The meeting that starts last. Its role is the one shown under the
// candidate's name and picked for their next booking.
export function latestMeeting(meetings: Meeting[]): Meeting | undefined {
  return meetings.reduce<Meeting | undefined>(
    (latest, meeting) =>
      !latest || meeting.startAt > latest.startAt ? meeting : latest,
    undefined,
  );
}
