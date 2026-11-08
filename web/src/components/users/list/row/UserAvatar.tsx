import { CountryFlag } from "@/components/elements/flags/CountryFlag";
import { UserRound } from "@/components/elements/icons";
import { FLAG_PREFIX } from "@/utils/flags/flag-options";
export function UserAvatar({ name }: { name: string }) {
  const flag = name.match(FLAG_PREFIX)?.[0].trim() ?? "";
  return (
    <span className="avatar" aria-hidden>
      {flag ? <CountryFlag value={flag} /> : <UserRound width={24} height={24} />}
    </span>
  );
}
