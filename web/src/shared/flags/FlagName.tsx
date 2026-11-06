import { CountryFlag } from "./CountryFlag";
import { FLAG_PREFIX } from "./flag-options";
export function FlagName({ value }: { value: string }) {
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  return (
    <span className="flag-name">
      <CountryFlag value={flag} />
      <span>{value.replace(FLAG_PREFIX, "")}</span>
    </span>
  );
}
