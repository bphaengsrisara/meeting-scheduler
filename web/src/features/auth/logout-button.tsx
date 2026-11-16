"use client";

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
    <AlertDialog>
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
