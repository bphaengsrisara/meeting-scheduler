"use client";

import { ClockIcon } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { MeetingFormInput, MeetingFormValues } from "./booking";

// The browser's own time box (typed: hours, minutes, arrow keys), with the
// clock on the left as in the design. The browser's time pop-up is hidden,
// as in shadcn's own time picker example: it cannot be styled.
export function TimeField({
  name,
  label,
  control,
  onPicked,
}: Readonly<{
  name: "startTime" | "endTime";
  label: string;
  control: Control<MeetingFormInput, unknown, MeetingFormValues>;
  onPicked?: (value: string) => void;
}>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <ClockIcon />
            </InputGroupAddon>
            <InputGroupInput
              {...field}
              id={name}
              type="time"
              aria-invalid={fieldState.invalid}
              className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              onChange={(event) => {
                field.onChange(event);
                if (event.target.value) onPicked?.(event.target.value);
              }}
            />
          </InputGroup>
        </Field>
      )}
    />
  );
}
