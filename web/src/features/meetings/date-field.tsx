"use client";

import { CalendarIcon } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatLongDay, fromDay, parseTypedDay, toDay } from "@/lib/dates";

// The meeting's day: picked from the calendar or typed. A typed date is read
// when the box loses focus; text that is not a date is reported as such.
export function DateField({
  id,
  day,
  invalid,
  disablePast,
  onChange,
}: {
  id: string;
  day: string;
  invalid: boolean;
  disablePast: boolean;
  onChange: (day: string, unreadable: boolean) => void;
}) {
  const [text, setText] = useState(day ? formatLongDay(day) : "");
  const [open, setOpen] = useState(false);
  // Closed when Next.js hides the page, so it is not open on return.
  useLayoutEffect(() => () => setOpen(false), []);

  const pick = (next: string) => {
    setText(next ? formatLongDay(next) : "");
    onChange(next, false);
  };

  const readText = () => {
    if (!text.trim()) {
      pick("");
      return;
    }
    const typed = parseTypedDay(text);
    if (typed) pick(typed);
    else onChange("", true);
  };

  return (
    <InputGroup>
      <InputGroupAddon>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <InputGroupButton size="icon-xs" aria-label="Choose a date" />
            }
          >
            <CalendarIcon />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={day ? fromDay(day) : undefined}
              defaultMonth={day ? fromDay(day) : undefined}
              disabled={disablePast ? { before: new Date() } : undefined}
              onSelect={(date) => {
                pick(date ? toDay(date) : "");
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        value={text}
        placeholder="e.g. Nov 20, 2026"
        autoComplete="off"
        aria-invalid={invalid}
        onChange={(event) => setText(event.target.value)}
        onBlur={readText}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            readText();
          }
        }}
      />
    </InputGroup>
  );
}
