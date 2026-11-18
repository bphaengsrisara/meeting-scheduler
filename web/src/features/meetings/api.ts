import "server-only";
import { callApi } from "@/lib/api";
import { startOfDayIn, startOfNextDayIn } from "@/lib/dates";
import type { Meeting, MeetingPage, Position } from "./types";

async function getJson<T>(path: string): Promise<T> {
  const response = await callApi(path);
  if (!response.ok) {
    throw new Error(`GET ${path} answered ${response.status}`);
  }
  return (await response.json()) as T;
}

export function listMeetings(query: URLSearchParams) {
  return getJson<MeetingPage>(`/meetings?${query.toString()}`);
}

// The API's largest page; one person's meetings in a day never reach it.
const DAY_PAGE_SIZE = 100;

// The user's meetings on one day of their time zone, for the booking form
// (the API leaves cancelled ones out).
export async function listDayMeetings(day: string, zone: string) {
  const query = new URLSearchParams({
    from: startOfDayIn(day, zone).toISOString(),
    to: startOfNextDayIn(day, zone).toISOString(),
    pageSize: String(DAY_PAGE_SIZE),
  });
  return (await listMeetings(query)).meetings;
}

export async function listPositions() {
  const { positions } = await getJson<{ positions: Position[] }>("/positions");
  return positions;
}

// null when the meeting does not exist or belongs to another account.
export async function getMeeting(id: string): Promise<Meeting | null> {
  const response = await callApi(`/meetings/${encodeURIComponent(id)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GET /meetings/:id answered ${response.status}`);
  }
  return ((await response.json()) as { meeting: Meeting }).meeting;
}
