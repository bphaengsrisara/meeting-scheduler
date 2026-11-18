import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/app/(app)/loading";
import {
  getMeeting,
  listDayMeetings,
  listPositions,
} from "@/features/meetings/api";
import { FormHeading } from "@/features/meetings/back-link";
import { MeetingForm } from "@/features/meetings/meeting-form";
import { dayAndTimeIn } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Edit Meeting · Vellicor" };

// Only pending and confirmed meetings that have not started can change;
// the others are part of the record, so there is nothing to edit.
const EDITABLE = new Set(["pending", "confirmed"]);

const TITLE = "Edit Meeting";

// The title shows at once; the form follows when its data is read.
export default function EditMeetingPage(
  props: Readonly<PageProps<"/meetings/[id]/edit">>,
) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Suspense
        fallback={
          <>
            <FormHeading title={TITLE} />
            <Loading />
          </>
        }
      >
        <EditMeetingForm params={props.params} />
      </Suspense>
    </div>
  );
}

async function EditMeetingForm({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const [, { id }, zone] = await Promise.all([
    requireUser(),
    params,
    getTimeZone(),
  ]);
  const meeting = await getMeeting(id);
  if (
    !meeting ||
    !EDITABLE.has(meeting.status) ||
    new Date(meeting.startAt) <= new Date()
  ) {
    notFound();
  }
  // The meeting's day, listed up front so the form opens with it.
  const { day } = dayAndTimeIn(new Date(meeting.startAt), zone);
  const [positions, dayMeetings] = await Promise.all([
    listPositions(),
    listDayMeetings(day, zone),
  ]);

  // The edit form is opened from the candidate's page; Back returns there.
  return (
    <>
      <FormHeading title={TITLE} back={`/candidates/${meeting.candidate.id}`} />
      <MeetingForm
        meeting={meeting}
        positions={positions}
        zone={zone}
        dayMeetings={dayMeetings.filter((other) => other.id !== meeting.id)}
      />
    </>
  );
}
