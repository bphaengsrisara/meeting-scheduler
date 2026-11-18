"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

// A guest who logs out cannot come back to their meetings, so they confirm.
export function LogoutButton({ isGuest }: { isGuest: boolean }) {
  const [open, setOpen] = useState(false);
  // The header stays on screen from page to page, so the dialog closes
  // when the address changes (the browser's Back or Forward while open).
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  if (pathname !== openedOn) {
    setOpenedOn(pathname);
    setOpen(false);
  }
  if (!isGuest) {
    return (
      <form action={logout}>
        <Button type="submit" variant="ghost">
          Logout
        </Button>
      </form>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" />}>
        Logout
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log Out of the Guest Account?</AlertDialogTitle>
          <AlertDialogDescription>
            Your meetings will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay Signed In</AlertDialogCancel>
          <form action={logout}>
            <Button type="submit" variant="destructive" className="w-full">
              Log Out
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
