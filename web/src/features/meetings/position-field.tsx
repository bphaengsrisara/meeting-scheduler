"use client";

import { Controller, type Control } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";
import type { MeetingFormInput, MeetingFormValues } from "./booking";
import type { Position } from "./types";

// The role this interview is for, from the position list.
export function PositionField({
  control,
  positions,
}: Readonly<{
  control: Control<MeetingFormInput, unknown, MeetingFormValues>;
  positions: Position[];
}>) {
  const [open, setOpen] = useClosedWhenHidden();
  return (
    <Controller
      name="positionId"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="position">Position</FieldLabel>
          <Select
            items={positions.map(({ id, name }) => ({
              value: id,
              label: name,
            }))}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
            open={open}
            onOpenChange={setOpen}
          >
            <SelectTrigger
              id="position"
              className="w-full"
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder="Choose a position…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
