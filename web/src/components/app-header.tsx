import { UserIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/features/auth/initials";
import { LogoutButton } from "@/features/auth/logout-button";
import { requireUser } from "@/lib/session";
import { Logo } from "./logo";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        {/* As in Figma: the app's name beside the logo, from sm up. */}
        <Link href="/" className="flex items-center gap-3">
          <Logo className="size-8" />
          <span className="hidden text-sm font-medium sm:inline">
            Candidate Meeting Scheduler
          </span>
        </Link>
        {/* The user part reads the session, so it streams in on its own. */}
        <Suspense>
          <HeaderUser />
        </Suspense>
      </div>
    </header>
  );
}

async function HeaderUser() {
  const user = await requireUser();
  const label = user.isAnonymous ? "Guest" : user.name || user.email;

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>
          {user.isAnonymous ? (
            <UserIcon aria-hidden />
          ) : (
            initials(user.name, user.email)
          )}
        </AvatarFallback>
      </Avatar>
      {/* A phone shows the avatar and Logout only, as in Figma. */}
      <span className="hidden max-w-48 truncate text-sm font-medium sm:inline">
        {label}
      </span>
      <LogoutButton isGuest={user.isAnonymous} />
    </div>
  );
}
