"use server";

import { redirect } from "next/navigation";
import { callApi, copyApiCookies } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "./schemas";

export type AuthError =
  | "invalid-credentials"
  | "email-taken"
  | "guest-overlap"
  | "guest-emails-taken"
  | "unknown";

const postJson = (path: string, body: unknown) =>
  callApi(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

export async function login(input: LoginInput): Promise<AuthError> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return "invalid-credentials";
  }
  const response = await postJson("/api/auth/sign-in/email", parsed.data);
  if (!response.ok) {
    if (response.status === 401) return "invalid-credentials";
    if (response.status !== 409) return "unknown";
    // The API kept a guest a guest: their meetings overlap the account's, or
    // their candidates' emails are already the account's.
    const { code } = (await response.json()) as { code?: string };
    return code === "GUEST_EMAILS_TAKEN"
      ? "guest-emails-taken"
      : "guest-overlap";
  }
  await copyApiCookies(response);
  redirect("/");
}

// A guest who signs up keeps their data: Better Auth links the new account to
// the guest session that this request carries in its cookie.
export async function signup(input: SignupInput): Promise<AuthError> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return "unknown";
  }
  const response = await postJson("/api/auth/sign-up/email", parsed.data);
  if (!response.ok) {
    const { code } = (await response.json()) as { code?: string };
    return code?.startsWith("USER_ALREADY_EXISTS") ? "email-taken" : "unknown";
  }
  await copyApiCookies(response);
  redirect("/");
}

export async function continueAsGuest(): Promise<AuthError> {
  // Already a guest in this browser: carry on with the same guest.
  if ((await getCurrentUser())?.isAnonymous) {
    redirect("/");
  }
  const response = await postJson("/api/auth/sign-in/anonymous", {});
  if (!response.ok) {
    return "unknown";
  }
  await copyApiCookies(response);
  redirect("/");
}

export async function logout() {
  const response = await postJson("/api/auth/sign-out", {});
  await copyApiCookies(response);
  redirect("/login");
}
