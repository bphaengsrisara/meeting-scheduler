import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/app/(app)/loading";
import {
  getMeeting,
  listDayMeetings,
  listPositions,
} from "@/features/meetings/api";
import { BackLink } from "@/features/meetings/back-link";
import { MeetingForm } from "@/features/meetings/meeting-form";
import { dayAndTimeIn } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = { title: "Edit Meeting · Vellicor" };

// Only pending and confirmed meetings can change; completed and cancelled
// ones are records, so there is nothing to edit.
const EDITABLE = new Set(["pending", "confirmed"]);

// The title shows at once; the form follows when its data is read.
export default function EditMeetingPage(
  props: PageProps<"/meetings/[id]/edit">,
) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink href="/" />
        <h1 className="text-2xl font-semibold">Edit Meeting</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <EditMeetingForm params={props.params} />
      </Suspense>
    </div>
  );
}

async function EditMeetingForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [, { id }, zone] = await Promise.all([
    requireUser(),
    params,
    getTimeZone(),
  ]);
  const meeting = await getMeeting(id);
  if (!meeting || !EDITABLE.has(meeting.status)) {
    notFound();
  }
  // The meeting's day, listed up front so the form opens with it.
  const { day } = dayAndTimeIn(new Date(meeting.startAt), zone);
  const [positions, dayMeetings] = await Promise.all([
    listPositions(),
    listDayMeetings(day, zone),
  ]);

  return (
    <MeetingForm
      meeting={meeting}
      positions={positions}
      zone={zone}
      dayMeetings={dayMeetings.filter((other) => other.id !== meeting.id)}
    />
  );
}
