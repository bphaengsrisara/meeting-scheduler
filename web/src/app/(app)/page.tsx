import type { Metadata } from "next";
import { GuestNotice } from "@/features/auth/guest-notice";
import { listMeetings, listPositions } from "@/features/meetings/api";
import {
  countFilters,
  parseDashboardParams,
  toMeetingsQuery,
} from "@/features/meetings/dashboard-params";
import { NoMatches, NoMeetings } from "@/features/meetings/empty-states";
import { MeetingCard } from "@/features/meetings/meeting-card";
import { MeetingFilters } from "@/features/meetings/meeting-filters";
import { MeetingsPagination } from "@/features/meetings/meetings-pagination";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Upcoming Meetings · Vellicor" };

export default async function UpcomingMeetingsPage(props: PageProps<"/">) {
  const [user, zone, searchParams] = await Promise.all([
    requireUser(),
    getTimeZone(),
    props.searchParams,
  ]);
  const params = parseDashboardParams(searchParams);
  const [page, positions] = await Promise.all([
    listMeetings(toMeetingsQuery(params, zone)),
    listPositions(),
  ]);
  const filtered = countFilters(params) > 0;
  // First use (nothing booked, nothing filtered): only the way to book.
  const firstUse = page.total === 0 && !filtered;

  return (
    <>
      {user.isAnonymous && <GuestNotice />}
      {/* "Book Meeting" comes with the booking form (commit 6). */}
      <h1 className="text-2xl font-semibold">Upcoming Meetings</h1>
      {firstUse ? (
        <NoMeetings />
      ) : (
        <>
          <MeetingFilters params={params} positions={positions} />
          <p className="text-sm text-muted-foreground">
            Times in your time zone ({zone})
          </p>
        </>
      )}
      {!firstUse && page.meetings.length === 0 && <NoMatches />}
      {page.meetings.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {page.meetings.map((meeting) => (
              <li key={meeting.id}>
                <MeetingCard meeting={meeting} zone={zone} />
              </li>
            ))}
          </ul>
          <MeetingsPagination params={params} totalPages={page.totalPages} />
        </>
      )}
    </>
  );
}
