import { SelectOption } from "@/shared/ui";
export function FieldOption({ value }: { value: string }) {
  return <SelectOption value={value}>{value}</SelectOption>;
}
