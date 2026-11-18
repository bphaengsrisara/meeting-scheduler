"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TIME_ZONE_COOKIE } from "./dates";

// Seconds. Long-lived on purpose: the browser rewrites the cookie whenever
// its time zone changes.
const ONE_YEAR = 60 * 60 * 24 * 365;

// Puts the browser's time zone in a cookie for the server (lib/time-zone.ts).
// The login page has it too, so it is set before the first list is shown.
// Intl is used only here: date-fns cannot read the browser's zone.
export function TimeZoneCookie() {
  const router = useRouter();

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.slice(TIME_ZONE_COOKIE.length + 1);
    if (current === zone) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${zone}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
