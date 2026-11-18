import { CalendarIcon, SearchIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// First use: nothing booked yet. Its "Book Meeting" button comes with the
// booking form (commit 6).
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
