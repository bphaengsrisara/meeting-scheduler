import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

// "‹ Back" above a page title. The booking forms lead back to the dashboard
// until the candidate page exists (commit 8).
export function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" />
      Back
    </Link>
  );
}
