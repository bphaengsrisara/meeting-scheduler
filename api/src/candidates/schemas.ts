import { z } from "zod";

// Length limits live here, not in the database (columns are text).
export const NAME_MAX = 100;
export const NOTES_MAX = 2000;
// The longest an email address can be.
export const EMAIL_MAX = 254;

export const candidateName = z
  .string()
  .trim()
  .min(1, "Enter the candidate's name.")
  .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`);

// Kept as typed (trimmed): the database compares emails without case.
export const candidateEmail = z
  .string()
  .trim()
  .min(1, "Enter the candidate's email.")
  .max(EMAIL_MAX, `Use ${EMAIL_MAX} characters or fewer.`)
  .pipe(z.email("Enter a valid email address."));

// Notes and comments: optional, so an empty one is stored as none.
export const optionalText = z
  .string()
  .trim()
  .max(NOTES_MAX, `Use ${NOTES_MAX} characters or fewer.`)
  .transform((value) => value || null)
  .nullable();

export const candidateIdParams = z.object({ id: z.uuid() });

// The candidate page edits the name and email together, or the notes.
export const updateCandidateBody = z
  .object({ name: candidateName, email: candidateEmail, notes: optionalText })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nothing to change.");

export type UpdateCandidateBody = z.infer<typeof updateCandidateBody>;
