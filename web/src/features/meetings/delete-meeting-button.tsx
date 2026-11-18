"use client";

import { useLayoutEffect, useState, useTransition } from "react";
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

// Delete asks first: a deleted meeting cannot be brought back.
export function DeleteMeetingButton({
  summary,
  onDelete,
}: {
  summary: string;
  onDelete: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  // Closed when Next.js hides the page, so it is not open on return.
  useLayoutEffect(() => () => setOpen(false), []);
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
