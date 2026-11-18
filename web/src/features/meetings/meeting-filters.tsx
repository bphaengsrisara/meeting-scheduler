"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDay, fromDay, toDay } from "@/lib/dates";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";
import { cn } from "@/lib/utils";
import {
  countFilters,
  dashboardHref,
  type DashboardParams,
} from "./dashboard-params";
import { statusLabel } from "./status-badge";
import { MEETING_STATUSES, type MeetingStatus, type Position } from "./types";

const ALL = "all";
// How long typing must pause before the list reloads: a common wait, long
// enough to skip the keys inside a word, short enough to feel live.
export const SEARCH_PAUSE_MS = 300;

// Every change goes into the URL; the page reads the URL and lists again.
export function MeetingFilters({
  params,
  positions,
}: {
  params: DashboardParams;
  positions: Position[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.q ?? "");
  const [urlSearch, setUrlSearch] = useState(params.q);
  // The last search the box sent itself. It can reach the URL after the
  // user has typed more, and must not put the older text back.
  const [sentSearch, setSentSearch] = useState(params.q);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const filters = countFilters(params);

  // The box follows the URL only when something else changed it (Back,
  // Clear All Filters); the user's own typing is never overwritten.
  if (params.q !== urlSearch) {
    setUrlSearch(params.q);
    if (params.q !== sentSearch) {
      setSearch(params.q ?? "");
      setSentSearch(params.q);
    }
  }

  const go = (changes: Partial<DashboardParams>) =>
    startTransition(() => {
      router.replace(dashboardHref(params, changes), { scroll: false });
    });

  // Search once the user pauses typing, not on every key.
  const onSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const q = value.trim() || undefined;
      setSentSearch(q);
      go({ q });
    }, SEARCH_PAUSE_MS);
  };

  const statuses = [
    { value: ALL, label: "All" },
    ...MEETING_STATUSES.map((status) => ({
      value: status,
      label: statusLabel(status),
    })),
  ];
  const positionItems = [
    { value: ALL, label: "All" },
    ...positions.map(({ id, name }) => ({ value: id, label: name })),
  ];

  return (
    <div className="flex flex-col gap-3" aria-busy={isPending}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <InputGroup className="lg:flex-1">
          {/* Our own clear button replaces the browser's (styled as the app). */}
          <InputGroupInput
            type="search"
            aria-label="Search by candidate name"
            placeholder="Search by candidate name…"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="[&::-webkit-search-cancel-button]:appearance-none"
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => {
                  clearTimeout(searchTimer.current);
                  setSearch("");
                  setSentSearch(undefined);
                  go({ q: undefined });
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <FilterSelect
            label="Status"
            items={statuses}
            value={params.status ?? ALL}
            onChange={(value) =>
              go({
                status: value === ALL ? undefined : (value as MeetingStatus),
              })
            }
            className="sm:w-40"
          />
          <FilterSelect
            label="Position"
            items={positionItems}
            value={params.position ?? ALL}
            onChange={(value) =>
              go({ position: value === ALL ? undefined : value })
            }
            className="sm:w-52"
          />
          <DateRangeFilter
            from={params.from}
            to={params.to}
            onChange={(from, to) => go({ from, to })}
          />
        </div>
      </div>
      {filters > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filters === 1 ? "1 filter" : `${filters} filters`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              startTransition(() => router.replace("/", { scroll: false }))
            }
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// "Status: All ▾": the label stays in the trigger, the value follows it.
function FilterSelect({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useClosedWhenHidden();
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next as string)}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger aria-label={label} className={cn("w-full", className)}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue className="truncate" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// From and To in one calendar. The range is applied when the popover closes,
// so picking the first day does not reload the list yet.
function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) {
  const [range, setRange] = useState<DateRange | undefined>(
    from
      ? { from: fromDay(from), to: to ? fromDay(to) : undefined }
      : undefined,
  );
  const label = rangeLabel(from, to);
  const [open, setOpen] = useClosedWhenHidden();

  // The picked range applies when the calendar closes.
  const apply = () => {
    const start = range?.from ? toDay(range.from) : undefined;
    const end = range?.to ? toDay(range.to) : start;
    if (start !== from || end !== to) onChange(start, end);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) apply();
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="col-span-2 justify-start font-normal sm:w-52"
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        <span className="truncate tabular-nums">{label}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={range} onSelect={setRange} />
        <div className="flex justify-end border-t p-2">
          <Button variant="ghost" size="sm" onClick={() => setRange(undefined)}>
            Clear Dates
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function rangeLabel(from?: string, to?: string) {
  if (!from) return "From – To";
  if (!to || to === from) return formatDay(from);
  return `${formatDay(from)} – ${formatDay(to)}`;
}
