import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/app/(app)/loading";
import { getCandidatePage } from "@/features/candidates/api";
import { latestMeeting } from "@/features/candidates/latest-meeting";
import { listPositions } from "@/features/meetings/api";
import { FormHeading } from "@/features/meetings/back-link";
import { MeetingForm } from "@/features/meetings/meeting-form";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Schedule a New Meeting · Vellicor",
};

const TITLE = "Schedule a New Meeting";

// The title shows at once; the form follows when its data is read.
export default function NewMeetingPage(
  props: Readonly<PageProps<"/meetings/new">>,
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
        <NewMeetingForm searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

// From a candidate's page (?candidate=<id>), the form books for that
// candidate, filled in and locked, and Back returns to their page. An id
// that is not one of the user's candidates opens the plain form instead.
async function NewMeetingForm({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [, { candidate: candidateId }, positions, zone] = await Promise.all([
    requireUser(),
    searchParams,
    listPositions(),
    getTimeZone(),
  ]);
  if (typeof candidateId !== "string") {
    return (
      <>
        <FormHeading title={TITLE} back="/" />
        <MeetingForm positions={positions} zone={zone} />
      </>
    );
  }

  const page = await getCandidatePage(candidateId);
  if (!page) {
    redirect("/meetings/new");
  }
  const { candidate, upcoming, history } = page;
  return (
    <>
      <FormHeading title={TITLE} back={`/candidates/${candidate.id}`} />
      <MeetingForm
        candidate={{
          id: candidate.id,
          name: candidate.name,
          positionId: latestMeeting([...upcoming, ...history])?.position.id,
        }}
        positions={positions}
        zone={zone}
      />
    </>
  );
}
