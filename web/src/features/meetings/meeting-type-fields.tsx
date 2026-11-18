"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import type { MeetingFormInput, MeetingFormValues } from "./booking";
import { RadioChoice } from "./radio-choice";

// Onsite or Online; the platform is asked only for Online, and picking
// Onsite clears it (the API and the database refuse a platform onsite).
export function MeetingTypeFields({
  form,
  online,
}: Readonly<{
  form: UseFormReturn<MeetingFormInput, unknown, MeetingFormValues>;
  online: boolean;
}>) {
  return (
    <>
      <Controller
        name="type"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Meeting Type</FieldLegend>
            <RadioGroup
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value);
                if (value === "on_site") form.setValue("platform", "");
              }}
              aria-invalid={fieldState.invalid}
            >
              <RadioChoice id="type-on-site" value="on_site" label="Onsite" />
              <RadioChoice id="type-online" value="online" label="Online" />
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />
      {online && (
        <Controller
          name="platform"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">Platform</FieldLegend>
              <RadioGroup
                value={field.value || null}
                onValueChange={field.onChange}
                aria-invalid={fieldState.invalid}
              >
                <RadioChoice id="platform-zoom" value="zoom" label="Zoom" />
                <RadioChoice
                  id="platform-google-meet"
                  value="google_meet"
                  label="Google Meet"
                />
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      )}
    </>
  );
}
