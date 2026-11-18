import { z } from "zod";
import { DAY_PATTERN, startOfDayIn, startOfNextDayIn } from "@/lib/dates";
import { NAME_MAX } from "./booking";
import { MEETING_STATUSES } from "./types";

// The dashboard's search, filters and page live in the URL, so a filtered
// page can be reloaded or shared. A value that does not parse is ignored.
// A day as the date filter writes it in the URL: 2026-11-01.
const day = z.string().regex(DAY_PATTERN);

const dashboardParamsSchema = z.object({
  // The search is a candidate's name, so it has the same limit.
  q: z.string().trim().min(1).max(NAME_MAX).optional().catch(undefined),
  status: z.enum(MEETING_STATUSES).optional().catch(undefined),
  position: z.uuid().optional().catch(undefined),
  from: day.optional().catch(undefined),
  to: day.optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type DashboardParams = z.infer<typeof dashboardParamsSchema>;
type SearchParams = Record<string, string | string[] | undefined>;

export function parseDashboardParams(searchParams: SearchParams) {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  return dashboardParamsSchema.parse(
    Object.fromEntries(
      Object.entries(searchParams).map(([key, value]) => [key, first(value)]),
    ),
  );
}

// The API's query: the picked days become times in the user's zone, and
// "to" covers its whole day (the API's "to" is exclusive).
export function toMeetingsQuery(params: DashboardParams, zone: string) {
  const query = new URLSearchParams({ page: String(params.page) });
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.position) query.set("position", params.position);
  if (params.from)
    query.set("from", startOfDayIn(params.from, zone).toISOString());
  if (params.to)
    query.set("to", startOfNextDayIn(params.to, zone).toISOString());
  return query;
}

// "4 filters": the search, status, position and the date range count one each.
export function countFilters(params: DashboardParams) {
  return [
    params.q,
    params.status,
    params.position,
    params.from ?? params.to,
  ].filter(Boolean).length;
}

// The dashboard URL with some values changed; any change of search or
// filter goes back to page 1.
export function dashboardHref(
  params: DashboardParams,
  changes: Partial<DashboardParams>,
) {
  const next = { ...params, page: 1, ...changes };
  const query = new URLSearchParams();
  for (const key of ["q", "status", "position", "from", "to"] as const) {
    const value = next[key];
    if (value) query.set(key, value);
  }
  if (next.page > 1) query.set("page", String(next.page));
  const search = query.toString();
  return search ? `/?${search}` : "/";
}
