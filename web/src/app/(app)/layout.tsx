import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {/* Hidden until Tab reaches it; jumps past the header to the page. */}
      <a
        href="#main"
        className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8"
      >
        {children}
      </main>
    </>
  );
}
