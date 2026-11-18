import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { isTimeZone, TIME_ZONE_COOKIE } from "./dates";

// The server renders the times, but only the browser knows its time zone,
// so the browser keeps it in a cookie. UTC until that cookie is set.
// Before the browser has sent its zone; meetings are stored in UTC anyway.
const FALLBACK_ZONE = "UTC";

export async function getTimeZone() {
  // Every TZDate reads the clock, so times are rendered per request.
  await connection();
  const zone = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  return zone && isTimeZone(zone) ? zone : FALLBACK_ZONE;
}
