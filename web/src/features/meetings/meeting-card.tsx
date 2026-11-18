import { CalendarIcon, MapPinIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { initials } from "@/features/auth/initials";
import { formatMeetingTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type { Meeting } from "./types";

// One meeting. "View Details" opens the candidate's page.
export function MeetingCard({
  meeting,
  zone,
}: Readonly<{
  meeting: Meeting;
  zone: string;
}>) {
  const { candidate, position } = meeting;
  const online = meeting.type === "online";
  const TypeIcon = online ? VideoIcon : MapPinIcon;

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials(candidate.name, "")}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="truncate">{candidate.name}</CardTitle>
            <CardDescription>{position.name}</CardDescription>
          </div>
        </div>
        <CardAction>
          <StatusBadge status={meeting.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex basis-full items-center gap-2 tabular-nums sm:basis-auto">
          <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
          {formatMeetingTime(
            new Date(meeting.startAt),
            new Date(meeting.endAt),
            zone,
          )}
        </span>
        <span className="flex items-center gap-2">
          <TypeIcon aria-hidden className="size-4 text-muted-foreground" />
          {online ? "Online" : "Onsite"}
        </span>
        <Link
          href={`/candidates/${candidate.id}`}
          aria-label={`View details for ${candidate.name}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "ml-auto",
          )}
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}
