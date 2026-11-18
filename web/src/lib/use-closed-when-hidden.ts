"use client";

import { useLayoutEffect, useState } from "react";

// Open or closed, for a pop-up (dialog, calendar, list). Next.js keeps a
// page the user left with its state, so the pop-up closes when the page is
// hidden, not to be open on return (Next.js "Preserving UI state").
export function useClosedWhenHidden() {
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => () => setOpen(false), []);
  return [open, setOpen] as const;
}
