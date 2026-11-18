import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

// Someone signed in with an account has nothing to do on login or sign-up.
// A guest stays: logging in or signing up is how a guest keeps their meetings.
export async function RedirectSignedIn() {
  const user = await getCurrentUser();
  if (user && !user.isAnonymous) {
    redirect("/");
  }
  return null;
}
