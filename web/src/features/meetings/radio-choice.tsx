import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

// One radio with its label; clicking the words picks it too.
export function RadioChoice({
  id,
  value,
  label,
}: {
  id: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}
