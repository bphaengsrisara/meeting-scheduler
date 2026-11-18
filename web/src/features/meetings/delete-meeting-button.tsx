"use client";

import { useTransition } from "react";
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
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";

// Delete asks first: a deleted meeting cannot be brought back.
export function DeleteMeetingButton({
  summary,
  onDelete,
}: Readonly<{
  summary: string;
  onDelete: () => Promise<boolean>;
}>) {
  const [open, setOpen] = useClosedWhenHidden();
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete Meeting
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete This Meeting?</AlertDialogTitle>
          <AlertDialogDescription>
            {summary}. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                if (!(await onDelete())) setOpen(false);
              })
            }
          >
            {isPending ? "Deleting…" : "Delete Meeting"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
