import { SelectOption } from "@/shared/ui";
export function FlagOption({ value, label }: { value: string; label: string }) {
  return (
    <SelectOption value={value}>
      {value} {label}
    </SelectOption>
  );
}
