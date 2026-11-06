import { useTranslation } from "react-i18next";
import { RefreshCw } from "@/shared/icons";
import { UserCount } from "./UserCount";
import { useUsersRefresh } from "./use-users-refresh";
export function UsersToolbar({
  search,
  onSearch,
  found,
}: {
  search: string;
  onSearch: (value: string) => void;
  found: number;
}) {
  const { t } = useTranslation();
  const refresh = useUsersRefresh();
  return (
    <div className="card-header users-toolbar">
      <h2>
        {t("Пользователи")}
        <UserCount />
      </h2>
      <div className="users-list-actions">
        <label className="users-search">
          <span className="sr-only">{t("Поиск пользователей")}</span>
          <input
            type="search"
            value={search}
            placeholder={t("Поиск по имени…")}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="secondary"
          disabled={refresh.isPending}
          aria-busy={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          <RefreshCw width={24} height={24} aria-hidden />
          {t(refresh.isPending ? "Обновляем…" : "Обновить")}
        </button>
        <span className="users-found" role="status">
          {t("Найдено: {{count}}", { count: found })}
        </span>
      </div>
    </div>
  );
}
