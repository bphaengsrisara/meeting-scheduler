import { Badge } from "@/components/ui/badge";
import type { MeetingStatus } from "./types";

// As drawn in Figma; the word carries the meaning, the colour only helps.
const looks = {
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
} as const;

export function StatusBadge({ status }: Readonly<{ status: MeetingStatus }>) {
  const { label, variant } = looks[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export const statusLabel = (status: MeetingStatus) => looks[status].label;
