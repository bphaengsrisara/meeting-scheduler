"use client";

import { useRef, useState } from "react";
import type { Meeting } from "./types";

// The user's meetings on the picked day, loaded as the date changes. null
// while loading or with no date. The edited meeting is left out of its own
// list. "reloaded" marks a list loaded again after the database refused a
// time booked meanwhile.
export function useDayMeetings(
  initial: Meeting[] | null,
  editedId: string | undefined,
) {
  const [meetings, setMeetings] = useState(initial);
  const [reloaded, setReloaded] = useState(false);
  // Only the latest day asked for may fill the list.
  const latest = useRef(0);

  const load = async (day: string, afterRefusal = false) => {
    const request = ++latest.current;
    setMeetings(null);
    setReloaded(afterRefusal);
    const response = await fetch(`/api/meetings?day=${day}`);
    if (request !== latest.current) return;
    const list = response.ok
      ? ((await response.json()) as { meetings: Meeting[] }).meetings
      : [];
    setMeetings(list.filter((other) => other.id !== editedId));
  };

  const clear = () => {
    latest.current++;
    setMeetings(null);
    setReloaded(false);
  };

  return { meetings, reloaded, load, clear };
}
