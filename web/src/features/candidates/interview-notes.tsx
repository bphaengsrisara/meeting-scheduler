"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LeaveGuard } from "@/features/meetings/leave-guard";
import { updateCandidate } from "./actions";

// Notes about the person, across all meetings. Saved with the button, not
// as they are typed; "Notes saved" shows until they are edited again.
export function InterviewNotes({
  candidateId,
  notes,
  labelledBy,
}: Readonly<{
  candidateId: string;
  notes: string | null;
  labelledBy: string;
}>) {
  const [value, setValue] = useState(notes ?? "");
  const [stored, setStored] = useState(notes ?? "");
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const changed = value !== stored;

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await updateCandidate(candidateId, { notes: value });
      if (result.ok) {
        const saved = result.data.candidate.notes ?? "";
        setValue(saved);
        setStored(saved);
        setJustSaved(true);
      } else {
        setError(
          result.fields?.notes?.[0] ??
            "Couldn't save the notes. Try again in a moment.",
        );
      }
    });

  return (
    <div className="flex flex-col gap-3">
      <LeaveGuard
        when={changed}
        onLeave={() => setValue(stored)}
        lost="Your changes to the interview notes will be lost."
      />
      <Field data-invalid={error !== null}>
        <Textarea
          aria-labelledby={labelledBy}
          aria-invalid={error !== null}
          placeholder="e.g. Strong React; ask about testing…"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setJustSaved(false);
          }}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <div className="flex items-center justify-end gap-3">
        {/* Always there, so screen readers announce the text when it shows. */}
        <span role="status" className="text-sm text-muted-foreground">
          {justSaved ? "Notes saved" : ""}
        </span>
        <Button variant="outline" disabled={isPending} onClick={save}>
          {isPending ? "Saving…" : "Save Notes"}
        </Button>
      </div>
    </div>
  );
}
