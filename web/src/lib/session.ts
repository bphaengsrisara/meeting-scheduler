import "server-only";
import { redirect } from "next/navigation";
import { callApi } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  isAnonymous: boolean;
};

// The one place that reads the session (Next.js calls this a Data Access
// Layer). The API checks the session cookie; the web app trusts its answer.
export async function getCurrentUser(): Promise<User | null> {
  const response = await callApi("/api/auth/get-session");
  if (!response.ok) {
    return null;
  }
  const session = (await response.json()) as { user: User } | null;
  if (!session) {
    return null;
  }
  const { id, name, email, isAnonymous } = session.user;
  return { id, name, email, isAnonymous: Boolean(isAnonymous) };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
