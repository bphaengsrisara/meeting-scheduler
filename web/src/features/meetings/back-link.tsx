import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

// "‹ Back" above a page title.
export function BackLink({ href }: Readonly<{ href: string }>) {
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
