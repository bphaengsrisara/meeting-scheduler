"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";
import { updateCandidate } from "./actions";

// Fixes the name once, so every meeting of the candidate shows it.
export function EditNameButton({
  candidateId,
  name,
}: Readonly<{ candidateId: string; name: string }>) {
  const [open, setOpen] = useClosedWhenHidden();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      if (!value.trim()) {
        setError("Enter the candidate's name.");
        return;
      }
      const result = await updateCandidate(candidateId, { name: value });
      if (result.ok) {
        setOpen(false);
        toast.success("Name saved");
      } else {
        setError(
          result.fields?.name?.[0] ??
            "Couldn't save the name. Try again in a moment.",
        );
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Opens with the stored name each time.
        if (next) {
          setValue(name);
          setError(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Edit Name
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
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <Field data-invalid={error !== null}>
            <FieldLabel htmlFor="candidate-name">Full Name</FieldLabel>
            <Input
              id="candidate-name"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={error !== null}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Name"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
