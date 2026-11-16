import type { Metadata } from "next";
import { GuestNotice } from "@/features/auth/guest-notice";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Upcoming Meetings · Vellicor" };

export default async function UpcomingMeetingsPage() {
  const user = await requireUser();

  return (
    <>
      {user.isAnonymous && <GuestNotice />}
      <h1 className="text-2xl font-semibold">Upcoming Meetings</h1>
    </>
  );
}
