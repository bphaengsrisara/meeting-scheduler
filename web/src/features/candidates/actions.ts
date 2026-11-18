"use server";

import { refresh } from "next/cache";
import { sendToApi, type SendResult } from "@/lib/api";
import type { Candidate } from "./types";

// Edit Name and Save Notes; the page shows the saved values when it worked.
export async function updateCandidate(
  id: string,
  changes: { name: string } | { notes: string },
): Promise<SendResult<{ candidate: Candidate }>> {
  const result = await sendToApi<{ candidate: Candidate }>(
    `/candidates/${encodeURIComponent(id)}`,
    "PATCH",
    changes,
  );
  if (result.ok) refresh();
  return result;
}
