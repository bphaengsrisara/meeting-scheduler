"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
import { moveMeeting, type StatusMove } from "@/features/meetings/actions";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";

const MOVES = {
  confirm: {
    label: "Confirm Meeting",
    pending: "Confirming…",
    done: "Meeting confirmed",
  },
  complete: {
    label: "Mark Completed",
    pending: "Saving…",
    done: "Meeting completed",
  },
  cancel: {
    label: "Cancel Meeting",
    pending: "Cancelling…",
    done: "Meeting cancelled",
  },
} satisfies Record<
  StatusMove,
  { label: string; pending: string; done: string }
>;

// Sends the move; the page reloads its data when it worked. A refusal (the
// meeting moved meanwhile, in another tab) shows the API's reason.
async function move(id: string, status: StatusMove) {
  const result = await moveMeeting(id, status);
  if (result.ok) {
    toast.success(MOVES[status].done);
  } else {
    toast.error(
      result.status === 409 && result.message
        ? result.message
        : "Couldn't change the meeting. Try again in a moment.",
    );
  }
  return result.ok;
}

// Confirm Meeting and Mark Completed: one click, as they are not lost.
export function StatusButton({
  id,
  move: status,
}: Readonly<{ id: string; move: "confirm" | "complete" }>) {
  const [isPending, startTransition] = useTransition();
  const { label, pending } = MOVES[status];
  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await move(id, status);
        })
      }
    >
      {isPending ? pending : label}
    </Button>
  );
}

// Cancel asks first: a cancelled meeting is final.
export function CancelMeetingButton({
  id,
  summary,
}: Readonly<{ id: string; summary: string }>) {
  const [open, setOpen] = useClosedWhenHidden();
  const [isPending, startTransition] = useTransition();
  const { label, pending } = MOVES.cancel;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel This Meeting?</AlertDialogTitle>
          <AlertDialogDescription>
            {summary}. It stays in the history as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                if (!(await move(id, "cancel"))) setOpen(false);
              })
            }
          >
            {isPending ? pending : label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
