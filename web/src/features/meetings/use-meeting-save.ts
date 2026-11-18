"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  createMeeting,
  deleteMeeting,
  updateMeeting,
  type SaveResult,
} from "./actions";
import {
  toFormErrors,
  toMeetingChanges,
  toNewMeeting,
  type MeetingFormInput,
  type MeetingFormValues,
} from "./booking";
import type { Meeting } from "./types";

export type Failure = { title?: string; message: string };
type Refusal = Extract<SaveResult, { ok: false }>;

const failedTo = (action: string) =>
  `Couldn't ${action}. Try again in a moment.`;

// Sends the form to the API and shows the answer: a toast and the next page
// when it worked, or why it was refused, where that belongs.
export function useMeetingSave({
  form,
  meeting,
  zone,
  reloadDay,
  onDone,
}: {
  form: UseFormReturn<MeetingFormInput, unknown, MeetingFormValues>;
  meeting?: Meeting;
  zone: string;
  reloadDay: (day: string) => Promise<void>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [saved, setSaved] = useState(false);

  // A saved or deleted meeting leads to its candidate's page, where the
  // result shows.
  const finish = (message: string, candidateId: string) => {
    setSaved(true);
    onDone();
    toast.success(message);
    router.push(`/candidates/${candidateId}`);
  };

  const showRefusal = async (result: Refusal, day: string) => {
    // Booked meanwhile, in another tab or by someone else's request.
    if (result.status === 409 && result.fields?.startAt) {
      setFailure({
        title: "This time overlaps an existing meeting.",
        message: "Choose another time. The list below was reloaded.",
      });
      await reloadDay(day);
      return;
    }
    const errors = toFormErrors(result.fields);
    // 400: a field is wrong. 409 on the email: the new candidate's email is
    // already one of the user's candidates.
    const fieldRefusal =
      result.status === 400 ||
      (result.status === 409 && result.fields?.candidateEmail);
    if (fieldRefusal && errors.length > 0) {
      for (const [index, { name, message }] of errors.entries()) {
        form.setError(name, { message }, { shouldFocus: index === 0 });
      }
      return;
    }
    // 409 on edit: the meeting was completed or cancelled meanwhile.
    const action = meeting ? "save the changes" : "book the meeting";
    setFailure({
      message:
        result.status === 409 && result.message
          ? result.message
          : failedTo(action),
    });
  };

  const save = async (values: MeetingFormValues) => {
    setFailure(null);
    const result = meeting
      ? await updateMeeting(meeting.id, toMeetingChanges(values, zone))
      : await createMeeting(toNewMeeting(values, zone));
    if (result.ok) {
      finish(
        meeting ? "Changes saved" : "Meeting booked",
        result.data.meeting.candidate.id,
      );
    } else {
      await showRefusal(result, values.date);
    }
  };

  const remove = async () => {
    if (!meeting) return false;
    const result = await deleteMeeting(meeting.id);
    if (result.ok) {
      finish("Meeting deleted", meeting.candidate.id);
      return true;
    }
    setFailure({
      message:
        result.status === 409 && result.message
          ? result.message
          : failedTo("delete the meeting"),
    });
    return false;
  };

  return { failure, clearFailure: () => setFailure(null), saved, save, remove };
}
