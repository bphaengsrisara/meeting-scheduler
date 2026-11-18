import { Badge } from "@/components/ui/badge";
import { formatLongDay, formatTime } from "@/lib/dates";
import { overlaps } from "./booking";
import type { Meeting } from "./types";

// The user's other meetings on the picked day, so a free time is easy to
// see. On a phone the name sits at the row's end, as in the design. Rows that overlap the picked times are marked in words, not colour
// alone. "reloaded" after the database refused a time booked meanwhile.
export function DayMeetings({
  day,
  meetings,
  picked,
  zone,
  reloaded,
}: Readonly<{
  day: string;
  meetings: Meeting[] | null;
  picked: { start: Date; end: Date } | null;
  zone: string;
  reloaded: boolean;
}>) {
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-4 text-sm"
    >
      <h2 className="font-medium">
        Your meetings on {formatLongDay(day)}
        {reloaded && " (reloaded)"}
      </h2>
      {meetings === null && (
        <p className="text-muted-foreground">Loading your meetings…</p>
      )}
      {meetings?.length === 0 && (
        <p className="text-muted-foreground">No other meetings on this day.</p>
      )}
      {meetings && meetings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {meetings.map((meeting) => (
            <li
              key={meeting.id}
              className="flex items-center justify-between gap-3 tabular-nums sm:grid sm:grid-cols-[10rem_1fr]"
            >
              <span>
                {formatTime(new Date(meeting.startAt), zone)} –{" "}
                {formatTime(new Date(meeting.endAt), zone)}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{meeting.candidate.name}</span>
                {picked && overlaps(picked, meeting) && (
                  <Badge variant="destructive">Overlaps</Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Times in your time zone ({zone})
      </p>
    </section>
  );
}
