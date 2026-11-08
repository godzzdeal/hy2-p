import { CountryFlag } from "@/components/elements/flags/CountryFlag";
import { SelectOption } from "@/components/ui/select/SelectOption";
export function FlagOption({ value, label }: { value: string; label: string }) {
  return (
    <SelectOption value={value}>
      <span className="flag-name">
        <CountryFlag value={value} />
        <span>{label}</span>
      </span>
    </SelectOption>
  );
}
