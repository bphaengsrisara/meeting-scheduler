"use client";

import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { formatDate } from "@/lib/dates";
import { useClosedWhenHidden } from "@/lib/use-closed-when-hidden";
import { SEARCH_PAUSE_MS } from "./meeting-filters";
import type { Position } from "./types";

// A candidate from GET /candidates, or the typed name as a new one (no id).
export type CandidateOption = {
  id: string;
  name: string;
  latestPositionId: string | null;
  latestStartAt: string | null;
};

// Pick an existing candidate or keep the typed name as a new candidate.
// The list comes from the API as the user types (filter={null}: the API
// has already matched the names).
export function CandidateField({
  id,
  candidateId,
  name,
  positions,
  zone,
  invalid,
  onType,
  onPick,
}: Readonly<{
  id: string;
  candidateId: string;
  name: string;
  positions: Position[];
  zone: string;
  invalid: boolean;
  onType: (name: string) => void;
  onPick: (candidate: CandidateOption) => void;
}>) {
  const [suggestions, setSuggestions] = useState<CandidateOption[]>([]);
  const [open, setOpen] = useClosedWhenHidden();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Only the latest search may fill the list; an older answer can come late.
  const latest = useRef(0);
  // The list lines up with the whole box, search icon included.
  const anchor = useRef<HTMLDivElement>(null);

  // Until the latest answer is in, the list says so instead of "no
  // candidates". Typing waits for a pause; opening the list asks at once.
  const [loading, setLoading] = useState(false);
  const search = (text: string, wait = SEARCH_PAUSE_MS) => {
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const request = ++latest.current;
      const q = new URLSearchParams({ q: text.trim() });
      const response = await fetch(`/api/candidates?${q}`);
      if (request !== latest.current) return;
      if (response.ok) {
        const { candidates } = (await response.json()) as {
          candidates: CandidateOption[];
        };
        setSuggestions(candidates);
      }
      setLoading(false);
    }, wait);
  };

  const typed = name.trim();
  // Two people can share a name, so a typed name can always be added as new.
  // While loading, the list is empty: Enter must not pick a name from an
  // older answer.
  let items: CandidateOption[] = [];
  if (!loading) {
    items = typed
      ? [
          ...suggestions,
          { id: "", name: typed, latestPositionId: null, latestStartAt: null },
        ]
      : suggestions;
  }
  // The box's text is always the value: an existing candidate (with id) or
  // a new name. With no value the combobox would empty the box on close.
  const selected = name
    ? { id: candidateId, name, latestPositionId: null, latestStartAt: null }
    : null;
  // The second line of a suggestion: what tells apart two people with the
  // same name (a common pattern: a muted line under the name).
  const details = (candidate: CandidateOption) => {
    const role = positions.find(
      (position) => position.id === candidate.latestPositionId,
    )?.name;
    if (!role || !candidate.latestStartAt) return "No meetings yet";
    const date = formatDate(new Date(candidate.latestStartAt), zone);
    return `${role} · latest meeting ${date}`;
  };

  return (
    <Combobox<CandidateOption>
      items={items}
      filter={null}
      autoHighlight
      value={selected}
      onValueChange={(candidate) => candidate && onPick(candidate)}
      inputValue={name}
      onInputValueChange={(text) => {
        onType(text);
        search(text);
      }}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) search(name, 0);
      }}
      itemToStringLabel={(candidate) => candidate.name}
      isItemEqualToValue={(a, b) => a.id === b.id && a.name === b.name}
    >
      <div ref={anchor}>
        <ComboboxInput
          id={id}
          autoComplete="off"
          placeholder="Search or type a new name…"
          aria-invalid={invalid}
        >
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          {/* Shown once the list closes on a name that matches nobody. */}
          {!open && typed && !candidateId && (
            <InputGroupAddon align="inline-end">
              <Badge variant="secondary">New candidate</Badge>
            </InputGroupAddon>
          )}
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={anchor}>
        {loading && (
          <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
            Loading candidates…
          </p>
        )}
        {!loading && (
          <ComboboxEmpty>
            No candidates yet. Type a name to add one.
          </ComboboxEmpty>
        )}
        <ComboboxList>
          {(candidate: CandidateOption) => (
            <ComboboxItem
              key={candidate.id || "new"}
              value={candidate}
              className="cursor-pointer"
            >
              {candidate.id ? (
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{candidate.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {details(candidate)}
                  </span>
                </span>
              ) : (
                <span className="truncate">
                  Add “{candidate.name}” as a New Candidate
                </span>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
