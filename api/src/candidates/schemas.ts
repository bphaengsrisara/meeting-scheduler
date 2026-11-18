import { z } from "zod";

// Length limits live here, not in the database (columns are text).
export const NAME_MAX = 100;

export const candidateName = z
  .string()
  .trim()
  .min(1, "Enter the candidate's name.")
  .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`);
