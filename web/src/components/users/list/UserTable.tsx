import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function UserTable({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="table-wrap relative overflow-x-auto">
      <table className="users-table">
        <thead>
          <tr>
            <th>{t("Пользователь")}</th>
            <th>{t("Доступ")}</th>
            <th>{t("Подключение")}</th>
            <th>{t("Трафик")}</th>
            <th>{t("Действует до")}</th>
            <th>
              <span className="sr-only">{t("Действия")}</span>
            </th>
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}
