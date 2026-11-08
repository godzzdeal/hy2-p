import { Plus, Rss, Users } from "@/components/elements/icons";
import { GroupFilter } from "@/components/groups/membership/GroupFilter";
import { QueryState } from "@/components/ui/QueryState";
import { UserDialogs } from "@/components/users/UserDialogs";
import { UserHierarchy } from "@/components/users/list/hierarchy/UserHierarchy";
import { UsersToolbar } from "@/components/users/list/toolbar/UsersToolbar";
import { PageEnum } from "@/config/navigation";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useUsersList } from "@/hooks/users/list/use-users-list";
import { type TUserDialog } from "@/services/users/dialog-types";
import { useUiStore } from "@/store/ui-store";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
const GroupManager = lazy(() =>
  import("@/components/groups/manage/GroupManager").then((module) => ({ default: module.GroupManager })),
);
export function UsersPage() {
  const { t } = useTranslation();
  const {
    query,
    groups,
    search,
    filtered,
    sections,
    pageCount,
    current,
    setPage,
    groupId,
    onSearch,
    onGroup,
  } = useUsersList();
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
        <QueryState isLoading={query.isPending || groups.isPending} error={query.error || groups.error} />
        <UserHierarchy
          sections={sections}
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
