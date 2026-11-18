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
import { candidateEmailSchema } from "@/features/meetings/booking";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";
import { updateCandidate } from "./actions";

type Errors = { name?: string; email?: string };

// Fixes the name and email once, so every meeting of the candidate shows them.
export function EditDetailsButton({
  candidateId,
  name,
  email,
}: Readonly<{ candidateId: string; name: string; email: string }>) {
  const [open, setOpen] = useClosedWhenHidden();
  const [values, setValues] = useState({ name, email });
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setFailure(null);
      const checked: Errors = {};
      if (!values.name.trim()) checked.name = "Enter the candidate's name.";
      const parsedEmail = candidateEmailSchema.safeParse(values.email);
      if (!parsedEmail.success) {
        checked.email = parsedEmail.error.issues[0].message;
      }
      setErrors(checked);
      if (checked.name || checked.email) return;

      const result = await updateCandidate(candidateId, values);
      if (result.ok) {
        setOpen(false);
        toast.success("Details saved");
        return;
      }
      // A field the API refused (another candidate has the email), or a
      // failure that is no field's.
      const fieldErrors = {
        name: result.fields?.name?.[0],
        email: result.fields?.email?.[0],
      };
      if (fieldErrors.name || fieldErrors.email) {
        setErrors(fieldErrors);
      } else {
        setFailure("Couldn't save the details. Try again in a moment.");
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Opens with the stored values each time.
        if (next) {
          setValues({ name, email });
          setErrors({});
          setFailure(null);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Edit Details
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
            <DialogTitle>Edit Details</DialogTitle>
          </DialogHeader>
          <Field data-invalid={errors.name !== undefined}>
            <FieldLabel htmlFor="candidate-name">Full Name</FieldLabel>
            <Input
              id="candidate-name"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={errors.name !== undefined}
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field data-invalid={errors.email !== undefined}>
            <FieldLabel htmlFor="candidate-email">Email</FieldLabel>
            <Input
              id="candidate-email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={errors.email !== undefined}
              value={values.email}
              onChange={(event) =>
                setValues({ ...values, email: event.target.value })
              }
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
