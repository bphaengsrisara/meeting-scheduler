"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMeetingTime } from "@/lib/dates";
import {
  defaultEndTime,
  emptyMeetingForm,
  meetingFormSchema,
  meetingTimes,
  meetingToForm,
  overlapMessage,
  overlaps,
  type MeetingFormInput,
  type MeetingFormValues,
} from "./booking";
import { CandidateField } from "./candidate-field";
import { DateField } from "./date-field";
import { DayMeetings } from "./day-meetings";
import { DeleteMeetingButton } from "./delete-meeting-button";
import { LeaveGuard } from "./leave-guard";
import { MeetingTypeFields } from "./meeting-type-fields";
import { PositionField } from "./position-field";
import { TimeField } from "./time-field";
import type { Meeting, Position } from "./types";
import { useDayMeetings } from "./use-day-meetings";
import { useMeetingSave } from "./use-meeting-save";

type MeetingFormProps = {
  meeting?: Meeting;
  positions: Position[];
  zone: string;
  dayMeetings?: Meeting[] | null;
};

// Next.js keeps a page the user left with its state (Next.js "Preserving UI
// state"). A form saved, deleted or left with "Leave" starts fresh when shown
// again; one left any other way keeps the draft.
export function MeetingForm(props: Readonly<MeetingFormProps>) {
  const [round, setRound] = useState(0);
  const resetWhenHidden = useRef(false);
  useLayoutEffect(
    () => () => {
      if (resetWhenHidden.current) {
        resetWhenHidden.current = false;
        setRound((current) => current + 1);
      }
    },
    [],
  );
  return (
    <MeetingFields
      key={round}
      {...props}
      onDone={() => {
        resetWhenHidden.current = true;
      }}
    />
  );
}

// The new and edit forms. Times are typed in the user's time zone and sent
// in UTC. The API checks everything again; the database refuses an overlap.
function MeetingFields({
  meeting,
  positions,
  zone,
  dayMeetings: initialDayMeetings = null,
  onDone,
}: Readonly<MeetingFormProps & { onDone: () => void }>) {
  const isEdit = meeting !== undefined;
  const [isPending, startTransition] = useTransition();
  const [unreadableDate, setUnreadableDate] = useState(false);
  // The overlap message shows after Book is pressed, then follows the times.
  const [checkOverlap, setCheckOverlap] = useState(false);
  // The end time the form filled in itself; it follows the start time until
  // the user changes it (typing "09" passes through "00" on the way).
  const filledEnd = useRef<string | null>(null);

  const form = useForm<MeetingFormInput, unknown, MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: meeting ? meetingToForm(meeting, zone) : emptyMeetingForm,
  });
  const [candidateId, candidateName, date, startTime, endTime, type] = useWatch(
    {
      control: form.control,
      name: [
        "candidateId",
        "candidateName",
        "date",
        "startTime",
        "endTime",
        "type",
      ],
    },
  );
  const day = useDayMeetings(initialDayMeetings, meeting?.id);
  const { failure, clearFailure, saved, save, remove } = useMeetingSave({
    form,
    meeting,
    zone,
    reloadDay: (refusedDay) => day.load(refusedDay, true),
    onDone,
  });

  const picked =
    date && startTime && endTime && endTime > startTime
      ? meetingTimes({ date, startTime, endTime }, zone)
      : null;
  const overlapping = picked
    ? (day.meetings ?? []).filter((other) => overlaps(picked, other))
    : [];

  // The form's own checks before anything is sent; then the API decides.
  const onSubmit = (values: MeetingFormValues) =>
    startTransition(async () => {
      clearFailure();
      setCheckOverlap(true);
      const { start } = meetingTimes(values, zone);
      // A new meeting must be in the future; an edited one keeps its time.
      if (!isEdit && start <= new Date()) {
        form.setError(
          "startTime",
          { message: "Start time must be later than now." },
          { shouldFocus: true },
        );
        return;
      }
      if (overlapping.length > 0) return;
      await save(values);
    });

  const timeErrors = [
    unreadableDate
      ? "Enter a date like Nov 20, 2026."
      : form.formState.errors.date?.message,
    form.formState.errors.startTime?.message,
    form.formState.errors.endTime?.message,
    // Not under the refusal alert, which already says it (as in the design).
    checkOverlap && !failure && overlapping[0]
      ? overlapMessage(overlapping[0], zone)
      : "",
  ].filter(Boolean);

  return (
    <form
      noValidate
      // Wrapped so the form reads its state when sent, not while rendering.
      onSubmit={(event) => form.handleSubmit(onSubmit)(event)}
      className="flex flex-col gap-6"
    >
      <LeaveGuard when={form.formState.isDirty && !saved} onLeave={onDone} />
      {failure && (
        <Alert variant="destructive">
          {failure.title && <AlertTitle>{failure.title}</AlertTitle>}
          <AlertDescription>{failure.message}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        {isEdit ? (
          <Field>
            <FieldLabel htmlFor="candidate">Candidate</FieldLabel>
            {/* The candidate of a meeting cannot change. */}
            <Input id="candidate" value={meeting.candidate.name} disabled />
          </Field>
        ) : (
          <Controller
            name="candidateName"
            control={form.control}
            render={({ fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate">Candidate Name</FieldLabel>
                <CandidateField
                  id="candidate"
                  candidateId={candidateId}
                  name={candidateName}
                  positions={positions}
                  zone={zone}
                  invalid={fieldState.invalid}
                  onType={(text) => {
                    if (text === form.getValues("candidateName")) return;
                    form.setValue("candidateName", text, { shouldDirty: true });
                    form.setValue("candidateId", "");
                  }}
                  onPick={(candidate) => {
                    form.setValue("candidateId", candidate.id);
                    form.setValue("candidateName", candidate.name, {
                      shouldDirty: true,
                      shouldValidate: fieldState.invalid,
                    });
                    // An existing candidate: the role of their latest
                    // meeting. A new one: no guess, the user chooses.
                    form.setValue(
                      "positionId",
                      candidate.latestPositionId ?? "",
                      {
                        shouldValidate: form.formState.isSubmitted,
                      },
                    );
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
        <PositionField control={form.control} positions={positions} />
        <div className="flex flex-col gap-3">
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem_10rem]">
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || unreadableDate}>
                  <FieldLabel htmlFor="date">Date</FieldLabel>
                  <DateField
                    id="date"
                    day={field.value}
                    invalid={fieldState.invalid || unreadableDate}
                    disablePast={!isEdit}
                    onChange={(next, unreadable) => {
                      setUnreadableDate(unreadable);
                      if (next === field.value) return;
                      field.onChange(next);
                      if (next) void day.load(next);
                      else day.clear();
                    }}
                  />
                </Field>
              )}
            />
            <TimeField
              name="startTime"
              label="Start Time"
              control={form.control}
              onPicked={(value) => {
                const end = form.getValues("endTime");
                if (!end || end === filledEnd.current) {
                  filledEnd.current = defaultEndTime(value);
                  form.setValue("endTime", filledEnd.current);
                }
              }}
            />
            <TimeField name="endTime" label="End Time" control={form.control} />
          </div>
          {timeErrors.length > 0 && (
            <div role="alert" className="flex flex-col gap-1">
              {timeErrors.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
        {date && (
          <DayMeetings
            day={date}
            meetings={day.meetings}
            picked={picked}
            zone={zone}
            reloaded={day.reloaded}
          />
        )}
        <MeetingTypeFields form={form} online={type === "online"} />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <Textarea
                {...field}
                id="notes"
                placeholder="e.g. Second round, bring the take-home…"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div className="flex flex-wrap gap-3">
        {isEdit ? (
          <>
            <DeleteMeetingButton
              summary={`${meeting.candidate.name} on ${formatMeetingTime(
                new Date(meeting.startAt),
                new Date(meeting.endAt),
                zone,
              )}`}
              onDelete={remove}
            />
            <Button type="submit" disabled={isPending} className="ml-auto">
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </>
        ) : (
          // Full width on a phone, as in the design.
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Booking…" : "Book Meeting"}
          </Button>
        )}
      </div>
    </form>
  );
}
