"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Asks before unsaved changes are lost. Links inside the app (‹ Back, the
// logo) open the dialog; closing or reloading the tab gets the browser's
// own warning, whose text cannot be changed.
export function LeaveGuard({
  when,
  onLeave,
}: Readonly<{
  when: boolean;
  onLeave: () => void;
}>) {
  const router = useRouter();
  const [href, setHref] = useState<string | null>(null);
  // Next.js keeps a page the user left, with its state. The dialog is a
  // passing question, so it is closed whenever the page is hidden, however
  // the user left (Next.js "Preserving UI state").
  useLayoutEffect(() => () => setHref(null), []);

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    // Runs before the click reaches Next.js's Link, which then never sees it.
    const onClick = (event: MouseEvent) => {
      const plainClick =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      const link = (event.target as Element).closest("a[href]");
      if (!plainClick || !(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || link.target === "_blank") return;
      event.preventDefault();
      event.stopPropagation();
      setHref(url.pathname + url.search);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when]);

  return (
    <AlertDialog
      open={href !== null}
      onOpenChange={(open) => !open && setHref(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Without Saving?</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes to this meeting will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              if (!href) return;
              // The changes are dropped, as the dialog says.
              onLeave();
              router.push(href);
            }}
          >
            Leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
