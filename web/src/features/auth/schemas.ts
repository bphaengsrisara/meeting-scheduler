import { z } from "zod";
import { NAME_MAX } from "@/features/meetings/booking";

// The same rules as the API (password length: docs/auth.md).
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 64;

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .pipe(z.email("Enter an email address like name@example.com."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  // The same limit as a candidate's name; the API sets none for an account.
  name: z.string().trim().max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer.`),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
