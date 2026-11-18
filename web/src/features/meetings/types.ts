// The API's meeting answers, as JSON (times are ISO 8601 strings in UTC).
export const MEETING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export type Position = { id: string; name: string };

// The names of the online platforms, as the form and the pages show them.
export const PLATFORM_LABELS = { zoom: "Zoom", google_meet: "Google Meet" };

// The four answers to "should we hire?", with no middle one, in order.
export const RECOMMENDATION_LABELS = {
  strong_no: "Strong No",
  no: "No",
  yes: "Yes",
  strong_yes: "Strong Yes",
};
export type Recommendation = keyof typeof RECOMMENDATION_LABELS;

// One per completed meeting; saving again replaces it.
export type Feedback = {
  recommendation: Recommendation;
  comment: string | null;
  updatedAt: string;
};

export type Meeting = {
  id: string;
  startAt: string;
  endAt: string;
  type: "on_site" | "online";
  platform: "zoom" | "google_meet" | null;
  status: MeetingStatus;
  notes: string | null;
  candidate: { id: string; name: string; email: string };
  position: Position;
  feedback: Feedback | null;
};

export type MeetingPage = {
  meetings: Meeting[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
