import { CountryFlag } from "@/components/elements/flags/CountryFlag";
import { SelectOption } from "@/components/ui/select/SelectOption";
export function FlagOption({ value, label }: { value: string; label: string }) {
  return (
    <SelectOption value={value}>
      <span className="flag-name inline-flex items-center gap-2 min-w-0 align-middle">
        <CountryFlag value={value} />
        <span>{label}</span>
      </span>
    </SelectOption>
  );
}
