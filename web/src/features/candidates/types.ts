import type { Meeting } from "@/features/meetings/types";

export type Candidate = {
  id: string;
  name: string;
  email: string;
  notes: string | null;
};

// GET /candidates/:id: open meetings earliest first, History newest first.
export type CandidatePage = {
  candidate: Candidate;
  upcoming: Meeting[];
  history: Meeting[];
};
