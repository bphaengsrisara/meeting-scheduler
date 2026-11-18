import { TZDate, tz } from "@date-fns/tz";
import { addDays, format, parseISO } from "date-fns";

// The one place the date and time formats are defined. Meetings are stored
// in UTC and shown in the user's time zone, always through @date-fns/tz.
const DATE = "EEE, MMM d, yyyy";
const TIME = "h:mm a";
const DAY = "MMM d, yyyy";

// The cookie that carries the browser's time zone to the server.
export const TIME_ZONE_COOKIE = "tz";

export function isTimeZone(zone: string) {
  return !Number.isNaN(new TZDate(0, zone).getTime());
}

export function formatDate(date: Date, zone: string) {
  return format(date, DATE, { in: tz(zone) });
}

export function formatTime(date: Date, zone: string) {
  return format(date, TIME, { in: tz(zone) });
}

// "Wed, Nov 18, 2026 · 10:00 AM – 11:00 AM"
export function formatMeetingTime(start: Date, end: Date, zone: string) {
  const times = `${formatTime(start, zone)} – ${formatTime(end, zone)}`;
  return `${formatDate(start, zone)} · ${times}`;
}

// A calendar day in the URL ("2026-11-01") and the date filter's label.
export const toDay = (date: Date) => format(date, "yyyy-MM-dd");
export const fromDay = (day: string) => parseISO(day);
export const formatDay = (day: string) => format(fromDay(day), DAY);

// The moment a calendar day starts in the user's time zone, as a plain UTC
// Date. The next day is counted in that zone, so a clock change is handled.
function dayIn(day: string, zone: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new TZDate(year, month - 1, date, zone);
}

export function startOfDayIn(day: string, zone: string) {
  return new Date(dayIn(day, zone));
}

export function startOfNextDayIn(day: string, zone: string) {
  return new Date(addDays(dayIn(day, zone), 1));
}
