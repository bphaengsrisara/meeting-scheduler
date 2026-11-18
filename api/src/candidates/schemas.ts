import { z } from "zod";

// Length limits live here, not in the database (columns are text).
export const NAME_MAX = 100;
export const NOTES_MAX = 2000;

export const candidateName = z
  .string()
  .trim()
  .min(1, "Enter the candidate's name.")
  .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`);

// Notes and comments: optional, so an empty one is stored as none.
export const optionalText = z
  .string()
  .trim()
  .max(NOTES_MAX, `Use ${NOTES_MAX} characters or fewer.`)
  .transform((value) => value || null)
  .nullable();

export const candidateIdParams = z.object({ id: z.uuid() });

// The candidate page edits the name and the interview notes, one at a time.
export const updateCandidateBody = z
  .object({ name: candidateName, notes: optionalText })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change.");

export type UpdateCandidateBody = z.infer<typeof updateCandidateBody>;
