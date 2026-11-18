import type { NextRequest } from "next/server";
import { listDayMeetings } from "@/features/meetings/api";
import { DAY_PATTERN } from "@/lib/dates";
import { getTimeZone } from "@/lib/time-zone";

// The booking form's list of the user's meetings on the picked day, asked by
// the browser when a date is picked (?day=2026-11-20).
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day") ?? "";
  if (!DAY_PATTERN.test(day)) {
    return Response.json({ error: { message: "Not found" } }, { status: 404 });
  }
  const meetings = await listDayMeetings(day, await getTimeZone());
  return Response.json({ meetings });
}
