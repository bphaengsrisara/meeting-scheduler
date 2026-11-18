import { Suspense, type ReactNode } from "react";
import { RedirectSignedIn } from "@/features/auth/redirect-signed-in";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      {/* Reads the session on its own, so the page itself stays static. */}
      <Suspense>
        <RedirectSignedIn />
      </Suspense>
      <div className="flex w-full max-w-sm flex-col gap-8">{children}</div>
    </main>
  );
}
