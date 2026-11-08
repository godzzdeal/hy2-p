import { useUsers } from "@/hooks/users/user-queries";
import { useTranslation } from "react-i18next";
export function UserCount() {
  const { t } = useTranslation();
  const users = useUsers();
  if (!users.data) return null;
  return (
    <span
      className="user-count"
      aria-label={t("Всего пользователей: {{count}}", { count: users.data.length })}
    >
      {users.data.length}
    </span>
  );
}
