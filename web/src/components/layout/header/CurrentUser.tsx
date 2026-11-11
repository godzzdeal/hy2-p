import { UserRound } from "@/components/elements/icons";
import { useAccount } from "@/hooks/admin/use-admin";
import { useTranslation } from "react-i18next";

export function CurrentUser() {
  const { t } = useTranslation();
  const account = useAccount();
  const username = account.data?.username || t("Администратор");
  return (
    <div
      className="current-user flex h-control min-w-0 max-w-64 items-center gap-2 border-2 border-line bg-surface-soft px-3 text-xl text-foreground max-tablet:hidden"
      title={username}
      aria-label={t("Администратор")}
    >
      <UserRound width={24} height={24} className="shrink-0 text-accent" aria-hidden />
      <span className="truncate">{username}</span>
    </div>
  );
}
