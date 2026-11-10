import { useUsers } from "@/hooks/users/user-queries";
import { Badge } from "@/components/ui/status/Badge";
import { useTranslation } from "react-i18next";
export function UserCount() {
  const { t } = useTranslation();
  const users = useUsers();
  if (!users.data) return null;
  return (
    <Badge
      className="user-count tablet:group-data-collapsed/app:h-5 tablet:group-data-collapsed/app:min-w-5 tablet:group-data-collapsed/app:p-0 tablet:group-data-collapsed/app:text-sm"
      variant="accent"
      count={users.data.length}
      title={t("Всего пользователей: {{count}}", { count: users.data.length })}
      aria-label={t("Всего пользователей: {{count}}", { count: users.data.length })}
    />
  );
}
