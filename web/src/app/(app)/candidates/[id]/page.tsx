import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Loading from "@/app/(app)/loading";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCandidatePage } from "@/features/candidates/api";
import { EditDetailsButton } from "@/features/candidates/edit-details-button";
import { InterviewNotes } from "@/features/candidates/interview-notes";
import { latestMeeting } from "@/features/candidates/latest-meeting";
import { HistoryRow, UpcomingRow } from "@/features/candidates/meeting-rows";
import { BackLink } from "@/features/meetings/back-link";
import { requireUser } from "@/lib/session";
import { getTimeZone } from "@/lib/time-zone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Candidate · Vellicor" };

// The back link shows at once; the rest follows when its data is read.
export default function CandidatePage(
  props: Readonly<PageProps<"/candidates/[id]">>,
) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <BackLink href="/" label="Dashboard" />
      <Suspense fallback={<Loading />}>
        <CandidateDetails params={props.params} />
      </Suspense>
    </div>
  );
}

async function CandidateDetails({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const [, { id }, zone] = await Promise.all([
    requireUser(),
    params,
    getTimeZone(),
  ]);
  const page = await getCandidatePage(id);
  if (!page) {
    notFound();
  }
  const { candidate, upcoming, history } = page;
  const role = latestMeeting([...upcoming, ...history])?.position.name;
  const bookHref = `/meetings/new?candidate=${candidate.id}`;
  const now = new Date();

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          {/* As on the meeting cards: the role beside the name, the email
              under it, quieter than the role. */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold break-words">
              {candidate.name}
            </h1>
            {role && <span className="text-lg">{role}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="text-sm break-words text-muted-foreground">
              {candidate.email}
            </p>
            <EditDetailsButton
              candidateId={candidate.id}
              name={candidate.name}
              email={candidate.email}
            />
          </div>
        </div>
        <Link
          href={bookHref}
          className={buttonVariants({ className: "w-full sm:w-auto" })}
        >
          Book Meeting
        </Link>
      </div>

      <Section title="Meeting Info" ruled>
        {upcoming.length > 0 ? (
          <ul className="divide-y">
            {upcoming.map((meeting) => (
              <UpcomingRow
                key={meeting.id}
                meeting={meeting}
                candidateName={candidate.name}
                zone={zone}
                now={now}
              />
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-muted-foreground">
              No upcoming meetings with {candidate.name}.
            </p>
            <Link
              href={bookHref}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Book Meeting
            </Link>
          </div>
        )}
      </Section>

      <Section title="Interview Notes" id="notes-title">
        <InterviewNotes
          candidateId={candidate.id}
          notes={candidate.notes}
          labelledBy="notes-title"
        />
      </Section>

      <Section title="History" ruled>
        {history.length > 0 ? (
          <ul className="divide-y">
            {history.map((meeting) => (
              <HistoryRow
                key={meeting.id}
                meeting={meeting}
                candidateName={candidate.name}
                zone={zone}
              />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-muted-foreground">
            No past meetings with {candidate.name} yet.
          </p>
        )}
      </Section>
    </>
  );
}

// A titled card. "ruled" draws a line under the title, above a list.
function Section({
  title,
  id,
  ruled = false,
  children,
}: Readonly<{
  title: string;
  id?: string;
  ruled?: boolean;
  children: ReactNode;
}>) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <h2 id={id} className="font-heading text-lg font-medium">
          {title}
        </h2>
        <div className={ruled ? "border-t" : undefined}>{children}</div>
      </CardContent>
    </Card>
  );
}
