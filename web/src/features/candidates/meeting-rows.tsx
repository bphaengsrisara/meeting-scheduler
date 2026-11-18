import { MapPinIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/features/meetings/status-badge";
import {
  PLATFORM_LABELS,
  RECOMMENDATION_LABELS,
  type Meeting,
} from "@/features/meetings/types";
import { formatMeetingTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { FeedbackButton } from "./feedback-button";
import { CancelMeetingButton, StatusButton } from "./status-buttons";

const timeOf = (meeting: Meeting, zone: string) =>
  formatMeetingTime(new Date(meeting.startAt), new Date(meeting.endAt), zone);

// One meeting in a list: its time and status, a line of details, an
// optional line under them, and its buttons (under it all on a phone).
function Row({
  meeting,
  zone,
  details,
  note,
  actions,
}: Readonly<{
  meeting: Meeting;
  zone: string;
  details: ReactNode;
  note?: ReactNode;
  actions?: ReactNode;
}>) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums">
            {timeOf(meeting, zone)}
          </span>
          <StatusBadge status={meeting.status} />
        </div>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          {details}
        </p>
        {note}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </li>
  );
}

// Meeting Info: a pending or confirmed meeting with its status buttons.
export function UpcomingRow({
  meeting,
  candidateName,
  zone,
  now,
}: Readonly<{
  meeting: Meeting;
  candidateName: string;
  zone: string;
  now: Date;
}>) {
  const online = meeting.type === "online";
  const TypeIcon = online ? VideoIcon : MapPinIcon;
  const type =
    online && meeting.platform
      ? `Online, ${PLATFORM_LABELS[meeting.platform]}`
      : "Onsite";
  // Once started, a meeting is part of the record: no Edit, only its status
  // moves. Completed by hand, never before it starts (it can run late).
  const started = new Date(meeting.startAt) <= now;
  const completable = started && meeting.status === "confirmed";

  return (
    <Row
      meeting={meeting}
      zone={zone}
      details={
        <>
          <TypeIcon aria-hidden className="size-4" />
          {type} · {meeting.position.name}
        </>
      }
      note={
        <>
          {started && (
            <p className="text-muted-foreground">
              {meeting.status === "confirmed"
                ? "This meeting has started. Mark it completed, or cancel it if it did not happen."
                : "This meeting has started. Confirm it to mark it completed, or cancel it if it did not happen."}
            </p>
          )}
          {meeting.notes && <p>{meeting.notes}</p>}
        </>
      }
      actions={
        <>
          {meeting.status === "pending" && (
            <StatusButton id={meeting.id} move="confirm" />
          )}
          {completable && <StatusButton id={meeting.id} move="complete" />}
          {!started && (
            <Link
              href={`/meetings/${meeting.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit Meeting
            </Link>
          )}
          <CancelMeetingButton
            id={meeting.id}
            summary={`${candidateName} on ${timeOf(meeting, zone)}`}
          />
        </>
      }
    />
  );
}

// History: a completed meeting with its feedback, or a cancelled one.
export function HistoryRow({
  meeting,
  candidateName,
  zone,
}: Readonly<{
  meeting: Meeting;
  candidateName: string;
  zone: string;
}>) {
  const { feedback } = meeting;
  const completed = meeting.status === "completed";
  let verdict = "";
  if (completed) {
    verdict = feedback
      ? ` · Recommendation: ${RECOMMENDATION_LABELS[feedback.recommendation]}`
      : " · No feedback yet";
  }

  return (
    <Row
      meeting={meeting}
      zone={zone}
      details={`${meeting.position.name}${verdict}`}
      note={
        completed ? (
          feedback?.comment && <p>{feedback.comment}</p>
        ) : (
          <p className="text-muted-foreground">
            Book again to fix a wrong cancel.
          </p>
        )
      }
      actions={
        completed && (
          <FeedbackButton
            meetingId={meeting.id}
            feedback={feedback}
            summary={`${candidateName} · ${timeOf(meeting, zone)} · ${meeting.position.name}`}
          />
        )
      }
    />
  );
}
