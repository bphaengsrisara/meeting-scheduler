"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { saveFeedback } from "@/features/meetings/actions";
import { RadioChoice } from "@/features/meetings/radio-choice";
import {
  RECOMMENDATION_LABELS,
  type Feedback,
  type Recommendation,
} from "@/features/meetings/types";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";

const choices = Object.entries(RECOMMENDATION_LABELS) as [
  Recommendation,
  string,
][];

// Add Feedback on a completed meeting, or Edit Feedback once it has some
// (the same dialog, filled in). Closing after typing asks first.
export function FeedbackButton({
  meetingId,
  feedback,
  summary,
}: Readonly<{
  meetingId: string;
  feedback: Feedback | null;
  summary: string;
}>) {
  const title = feedback ? "Edit Feedback" : "Add Feedback";
  const [open, setOpen] = useClosedWhenHidden();
  const [discarding, setDiscarding] = useClosedWhenHidden();
  const [recommendation, setRecommendation] = useState<Recommendation | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const changed =
    recommendation !== (feedback?.recommendation ?? "") ||
    comment !== (feedback?.comment ?? "");

  const save = () =>
    startTransition(async () => {
      setFailure(null);
      if (!recommendation) {
        setError("Choose a recommendation.");
        return;
      }
      const result = await saveFeedback(meetingId, { recommendation, comment });
      if (result.ok) {
        setOpen(false);
        toast.success("Feedback saved");
      } else {
        setFailure(
          result.status === 409 && result.message
            ? result.message
            : "Couldn't save the feedback. Try again in a moment.",
        );
      }
    });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            // Opens with the stored feedback each time.
            setRecommendation(feedback?.recommendation ?? "");
            setComment(feedback?.comment ?? "");
            setError(null);
            setFailure(null);
            setOpen(true);
          } else if (changed && !isPending) {
            setDiscarding(true);
          } else {
            setOpen(false);
          }
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>
          {title}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <form
            noValidate
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{summary}</DialogDescription>
            </DialogHeader>
            {failure && (
              <p role="alert" className="text-sm text-destructive">
                {failure}
              </p>
            )}
            <FieldSet data-invalid={error !== null}>
              <FieldLegend variant="label">Recommendation</FieldLegend>
              <RadioGroup
                value={recommendation || null}
                onValueChange={(value) => {
                  setRecommendation(value as Recommendation);
                  setError(null);
                }}
                aria-invalid={error !== null}
                className="flex flex-wrap gap-x-5 gap-y-2"
              >
                {choices.map(([value, label]) => (
                  <RadioChoice
                    key={value}
                    id={`recommendation-${value}`}
                    value={value}
                    label={label}
                  />
                ))}
              </RadioGroup>
              {error && <FieldError>{error}</FieldError>}
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="feedback-comment">
                Comment (optional)
              </FieldLabel>
              <Textarea
                id="feedback-comment"
                placeholder="e.g. Clear on React state, unsure on SQL joins…"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => (changed ? setDiscarding(true) : setOpen(false))}
              >
                Close
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discarding} onOpenChange={setDiscarding}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard This Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              What you entered will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setDiscarding(false);
                setOpen(false);
              }}
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
