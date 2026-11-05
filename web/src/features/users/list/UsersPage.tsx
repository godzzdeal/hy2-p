import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Plus } from "lucide-react";
import { UserDialogs } from "@/features/users";
import type { TUserDialog } from "@/features/users";
import { useConfiguration } from "@/features/configuration/model";
import { useUsers } from "@/features/users/model";
import { NETWORK } from "@/shared/http";
import { QueryState } from "@/shared/ui";
import { UserTable } from "./UserTable";
export function UsersPage() {
  const { t } = useTranslation();
  const query = useUsers();
  const configuration = useConfiguration();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<TUserDialog>(null);
  const filtered = (query.data ?? []).filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()),
  );
  const pageCount = Math.ceil(filtered.length / NETWORK.pageSize);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const visible = filtered.slice(current * NETWORK.pageSize, (current + 1) * NETWORK.pageSize);
  function onSearch(value: string) {
    setSearch(value);
    setPage(0);
  }
  return (
    <>
      <div className="page-heading" id="users-top" data-scroll-section data-scroll-label={t("Пользователи")}>
        <div>
          <h1>{t("Пользователи")}</h1>
          <p>{t("Доступ, подключения, потребление и квоты трафика.")}</p>
        </div>
        <button className="primary" onClick={() => setDialog({ type: "create" })}>
          <Plus size={20} aria-hidden />
          {t("Добавить пользователя")}
        </button>
      </div>
      {configuration.data?.authMode === "native" && (
        <p className="info-note">
          {t("Панель не подменяет auth. Пользователи и лимиты панели не управляют внешней аутентификацией.")}
        </p>
      )}
      <section
        className="card"
        id="users-list"
        data-scroll-section
        data-scroll-label={t("Список пользователей")}
      >
        <div className="card-header">
          <h2>
            {t("Все пользователи /")}
            {query.data?.length ?? 0}
          </h2>
          <input
            className="search"
            aria-label={t("Поиск пользователей")}
            placeholder={t("Поиск по имени\u2026")}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <QueryState isLoading={query.isPending} error={query.error} />
        <UserTable
          users={visible}
          onEdit={(user) => setDialog({ type: "edit", user })}
          onShare={(user) => setDialog({ type: "share", user })}
          onDelete={(user) => setDialog({ type: "delete", user })}
          onTraffic={(user) => setDialog({ type: "traffic", user })}
        />
        {!query.isPending && !filtered.length && (
          <p className="empty">
            {search
              ? t("Ничего не найдено.")
              : t("Добавьте первого пользователя для получения ссылки подключения.")}
          </p>
        )}
        {pageCount > 1 && (
          <div className="config-footer">
            <button className="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>
              {t("Назад")}
            </button>
            <span>
              {current + 1} / {pageCount}
            </span>
            <button
              className="secondary"
              disabled={current + 1 >= pageCount}
              onClick={() => setPage(current + 1)}
            >
              {t("Далее")}
            </button>
          </div>
        )}
      </section>
      <UserDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
