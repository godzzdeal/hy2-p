import { SelectOption } from "@/components/ui/select/SelectOption";
export function FieldOption({ value }: { value: string }) {
  return <SelectOption value={value}>{value}</SelectOption>;
}
