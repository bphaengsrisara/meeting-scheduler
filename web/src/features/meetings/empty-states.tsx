import { CalendarIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// First use: nothing booked yet, so the one thing to do is book.
export function NoMeetings() {
  return (
    <Empty className="flex-none border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarIcon />
        </EmptyMedia>
        <EmptyTitle>No Upcoming Meetings</EmptyTitle>
        <EmptyDescription>Book a meeting to see it here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/meetings/new" className={buttonVariants()}>
          Book Meeting
        </Link>
      </EmptyContent>
    </Empty>
  );
}

// Search or filters found nothing: say how to fix it, with no call to book.
export function NoMatches() {
  return (
    <Empty className="flex-none border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>No Meetings Found</EmptyTitle>
        <EmptyDescription>
          No meetings match your search and filters. Change one of them, or
          clear all filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
