import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

const look =
  "flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground";

// "‹ Back" above a page title. Without an href (the page is still reading
// where Back leads), the same words show, not yet a link.
export function BackLink({
  href,
  label = "Back",
}: Readonly<{ href?: string; label?: string }>) {
  if (!href) {
    return (
      <span className={`${look} opacity-50`}>
        <ChevronLeftIcon className="size-4" />
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={look}>
      <ChevronLeftIcon className="size-4" />
      {label}
    </Link>
  );
}

// The back link and the h1 of the booking form's pages.
export function FormHeading({
  title,
  back,
}: Readonly<{ title: string; back?: string }>) {
  return (
    <div className="flex flex-col gap-2">
      <BackLink href={back} />
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
  );
}
