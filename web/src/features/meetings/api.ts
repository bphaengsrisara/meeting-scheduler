import "server-only";
import { callApi } from "@/lib/api";
import type { MeetingPage, Position } from "./types";

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

export async function listPositions() {
  const { positions } = await getJson<{ positions: Position[] }>("/positions");
  return positions;
}
