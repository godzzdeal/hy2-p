import { UserRound } from "@/shared/icons";
import { CountryFlag, FLAG_PREFIX } from "@/shared/flags";
export function UserAvatar({ name }: { name: string }) {
  const flag = name.match(FLAG_PREFIX)?.[0].trim() ?? "";
  return (
    <span className="avatar" aria-hidden>
      {flag ? <CountryFlag value={flag} /> : <UserRound width={24} height={24} />}
    </span>
  );
}
