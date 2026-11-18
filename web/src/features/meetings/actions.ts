"use server";

import { refresh } from "next/cache";
import { sendToApi, type SendResult } from "@/lib/api";
import type { MeetingBody } from "./booking";
import type { Meeting, Recommendation } from "./types";

export type SaveResult = SendResult<{ meeting: Meeting }>;

const meetingPath = (id: string) => `/meetings/${encodeURIComponent(id)}`;

export async function createMeeting(body: MeetingBody): Promise<SaveResult> {
  return sendToApi("/meetings", "POST", body);
}

export async function updateMeeting(
  id: string,
  body: MeetingBody,
): Promise<SaveResult> {
  return sendToApi(meetingPath(id), "PATCH", body);
}

export async function deleteMeeting(id: string): Promise<SendResult> {
  return sendToApi(meetingPath(id), "DELETE");
}

// The candidate page's changes. Each reloads the page's data when it worked.

export type StatusMove = "confirm" | "cancel" | "complete";

export async function moveMeeting(
  id: string,
  move: StatusMove,
): Promise<SendResult> {
  const result = await sendToApi(`${meetingPath(id)}/${move}`, "POST");
  if (result.ok) refresh();
  return result;
}

export async function saveFeedback(
  id: string,
  body: { recommendation: Recommendation; comment: string },
): Promise<SendResult> {
  const result = await sendToApi(`${meetingPath(id)}/feedback`, "PUT", body);
  if (result.ok) refresh();
  return result;
}
