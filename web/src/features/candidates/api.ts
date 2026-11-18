import "server-only";
import { callApi } from "@/lib/api";
import type { CandidatePage } from "./types";

// null when the candidate does not exist or belongs to another account.
export async function getCandidatePage(
  id: string,
): Promise<CandidatePage | null> {
  const response = await callApi(`/candidates/${encodeURIComponent(id)}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GET /candidates/:id answered ${response.status}`);
  }
  return (await response.json()) as CandidatePage;
}
