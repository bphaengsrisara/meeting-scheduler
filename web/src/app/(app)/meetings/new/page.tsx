import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "@/app/(app)/loading";
import { listPositions } from "@/features/meetings/api";
import { BackLink } from "@/features/meetings/back-link";
import { MeetingForm } from "@/features/meetings/meeting-form";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Schedule a New Meeting · Vellicor",
};

// The title shows at once; the form follows when its data is read.
export default function NewMeetingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink href="/" />
        <h1 className="text-2xl font-semibold">Schedule a New Meeting</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <NewMeetingForm />
      </Suspense>
    </div>
  );
}

async function NewMeetingForm() {
  const [, positions, zone] = await Promise.all([
    requireUser(),
    listPositions(),
    getTimeZone(),
  ]);
  return <MeetingForm positions={positions} zone={zone} />;
}
