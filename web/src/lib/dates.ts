import { TZDate, tz } from "@date-fns/tz";
import { addDays, format, isValid, parse, parseISO } from "date-fns";

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

// A calendar day as text ("2026-11-01"): in the URL and in the booking form.
export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const toDay = (date: Date) => format(date, "yyyy-MM-dd");
export const fromDay = (day: string) => parseISO(day);
export const formatDay = (day: string) => format(fromDay(day), DAY);
// With the weekday, as on the meeting cards: "Fri, Nov 20, 2026".
export const formatLongDay = (day: string) => format(fromDay(day), DATE);

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

// A day and a clock time ("14:30") in the user's time zone, as a UTC Date.
export function instantIn(day: string, time: string, zone: string) {
  const [year, month, date] = day.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(new TZDate(year, month - 1, date, hours, minutes, zone));
}

// The other way: the day and clock time a stored meeting shows in that zone.
export function dayAndTimeIn(date: Date, zone: string) {
  return {
    day: format(date, "yyyy-MM-dd", { in: tz(zone) }),
    time: format(date, "HH:mm", { in: tz(zone) }),
  };
}

// The booking form's date box also takes typed dates: the format it shows,
// the same without the weekday, or the URL's "2026-11-20".
const TYPED_DAY_FORMATS = [DATE, DAY, "yyyy-MM-dd"];

export function parseTypedDay(text: string): string | null {
  for (const pattern of TYPED_DAY_FORMATS) {
    const date = parse(text.trim(), pattern, new Date());
    if (isValid(date)) return toDay(date);
  }
  return null;
}
