import { useTranslation } from "react-i18next";
import { useState, lazy, Suspense } from "react";
import { PageEnum } from "@/app/navigation";
import { useUiStore } from "@/app/state";
import { Plus, Rss, Users } from "@/shared/icons";
import { UserDialogs } from "@/features/users";
import { type TUserDialog } from "@/features/users";
import { useConfiguration } from "@/features/configuration/model";
import { QueryState } from "@/shared/ui";
import { UserTable } from "./UserTable";
import { UsersToolbar } from "./toolbar";
import { GroupFilter } from "@/features/groups";
import { useUsersList } from "./use-users-list";
const GroupManager = lazy(() =>
  import("@/features/groups/manage").then((module) => ({ default: module.GroupManager })),
);
export function UsersPage() {
  const { t } = useTranslation();
  const { query, search, filtered, visible, pageCount, current, setPage, groupId, onSearch, onGroup } =
    useUsersList();
  const selectPage = useUiStore((state) => state.selectPage);
  const configuration = useConfiguration();
  const [dialog, setDialog] = useState<TUserDialog>(null);
  const [isGroupsOpen, setGroupsOpen] = useState(false);
  return (
    <>
      <div className="page-heading" id="users-top" data-scroll-section data-scroll-label={t("Пользователи")}>
        <div>
          <h1>{t("Пользователи")}</h1>
          <p>{t("Доступ, подключения, потребление и квоты трафика.")}</p>
        </div>
        <div className="row-actions">
          <button className="secondary" onClick={() => setGroupsOpen(true)}>
            <Users width={24} height={24} aria-hidden />
            {t("Группы")}
          </button>
          <button className="secondary" onClick={() => selectPage(PageEnum.Subscriptions)}>
            <Rss width={24} height={24} aria-hidden />
            {t("Настроить подписку")}
          </button>
          <button className="primary" onClick={() => setDialog({ type: "create" })}>
            <Plus width={24} height={24} aria-hidden />
            {t("Добавить пользователя")}
          </button>
        </div>
      </div>
      {configuration.data?.authMode === "native" && (
        <p className="info-note">
          {t("Панель не подменяет auth. Пользователи и лимиты панели не управляют внешней аутентификацией.")}
        </p>
      )}
      {configuration.data && configuration.data.authMode !== "native" && (
        <p className="info-note">
          {t("Создайте пользователя, затем откройте его QR-код или скопируйте подписку для Happ.")}
        </p>
      )}
      <section
        className="card"
        id="users-list"
        data-scroll-section
        data-scroll-label={t("Список пользователей")}
      >
        <UsersToolbar search={search} onSearch={onSearch} found={filtered.length}>
          <GroupFilter value={groupId} onChange={onGroup} />
        </UsersToolbar>
        <QueryState isLoading={query.isPending} error={query.error} />
        <UserTable
          users={visible}
          onEdit={(user) => setDialog({ type: "edit", user })}
          onShare={(user) => setDialog({ type: "share", user })}
          onDelete={(user) => setDialog({ type: "delete", user })}
          onTraffic={(user) => setDialog({ type: "traffic", user })}
          onAccess={(user) => setDialog({ type: "access", user })}
          onDevices={(user) => setDialog({ type: "devices", user })}
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
      <Suspense fallback={<p role="status">{t("Загрузка формы…")}</p>}>
        {isGroupsOpen && <GroupManager onClose={() => setGroupsOpen(false)} />}
      </Suspense>
    </>
  );
}
