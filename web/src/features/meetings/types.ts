// The API's meeting answers, as JSON (times are ISO 8601 strings in UTC).
export const MEETING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export type Position = { id: string; name: string };

export type Meeting = {
  id: string;
  startAt: string;
  endAt: string;
  type: "on_site" | "online";
  platform: "zoom" | "google_meet" | null;
  status: MeetingStatus;
  notes: string | null;
  candidate: { id: string; name: string };
  position: Position;
};

export type MeetingPage = {
  meetings: Meeting[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
