"use server";

import { callApi } from "@/lib/api";
import type { MeetingBody } from "./booking";

// What the form needs from a refused save: the status, the API's message and
// its messages per field.
export type SaveResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      message?: string;
      fields?: Record<string, string[]>;
    };

async function send(path: string, method: string, body?: MeetingBody) {
  const response = await callApi(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok) {
    return { ok: true } as const;
  }
  const { error } = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; fields?: Record<string, string[]> };
  };
  return {
    ok: false,
    status: response.status,
    message: error?.message,
    fields: error?.fields,
  } as const;
}

const meetingPath = (id: string) => `/meetings/${encodeURIComponent(id)}`;

export async function createMeeting(body: MeetingBody): Promise<SaveResult> {
  return send("/meetings", "POST", body);
}

export async function updateMeeting(
  id: string,
  body: MeetingBody,
): Promise<SaveResult> {
  return send(meetingPath(id), "PATCH", body);
}

export async function deleteMeeting(id: string): Promise<SaveResult> {
  return send(meetingPath(id), "DELETE");
}
