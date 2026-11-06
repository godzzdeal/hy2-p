import { SelectOption } from "@/shared/ui/select";
import { CountryFlag } from "../CountryFlag";
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
