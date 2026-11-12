"use client";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/cards/Card";
import { Notice } from "@/components/ui/feedback";
import { Plus, Users } from "@/components/elements/icons";
import { GroupFilter } from "@/components/groups/membership/GroupFilter";
import { QueryState } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/loading";
import { UserDialogs } from "@/components/users/UserDialogs";
import { UserHierarchy } from "@/components/users/list/hierarchy/UserHierarchy";
import { UsersToolbar } from "@/components/users/list/toolbar/UsersToolbar";
import { useConfiguration } from "@/hooks/configuration/use-configuration";
import { useUsersList } from "@/hooks/users/list/use-users-list";
import { type TUserDialog } from "@/services/users/dialog-types";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
const GroupManager = lazy(() =>
  import("@/components/groups/manage/GroupManager").then((module) => ({
    default: module.GroupManager,
  })),
);
export default function UsersPage() {
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
  const configuration = useConfiguration();
  const [dialog, setDialog] = useState<TUserDialog>(null);
  const [isGroupsOpen, setGroupsOpen] = useState(false);
  return (
    <>
      <div
        className="page-heading flex justify-between items-start gap-4 mb-5 max-tablet:flex-col max-tablet:items-start"
        id="users-top"
        data-scroll-section
        data-scroll-label={t("Пользователи")}
      >
        <div>
          <h1>{t("Пользователи")}</h1>
        </div>
        <Actions>
          <Button variant="secondary" onClick={() => setGroupsOpen(true)}>
            <Users width={24} height={24} aria-hidden />
            {t("Группы")}
          </Button>
          <Button variant="primary" onClick={() => setDialog({ type: "create" })}>
            <Plus width={24} height={24} aria-hidden />
            {t("Добавить")}
          </Button>
        </Actions>
      </div>
      {configuration.data?.authMode === "native" && (
        <Notice variant="warning">
          {t("Панель не подменяет auth. Пользователи и лимиты панели не управляют внешней аутентификацией.")}
        </Notice>
      )}
      {configuration.data && configuration.data.authMode !== "native" && (
        <Notice>
          {t(
            "Создайте пользователя, затем откройте и отсканируйте QR-код или скопируйте адрес подписки в используемое приложение.",
          )}
        </Notice>
      )}
      <Card id="users-list" data-scroll-section data-scroll-label={t("Список пользователей")}>
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
          <EmptyState>
            {search
              ? t("Ничего не найдено.")
              : t("Добавьте первого пользователя для получения ссылки подключения.")}
          </EmptyState>
        )}
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
      </Card>
      <UserDialogs dialog={dialog} onClose={() => setDialog(null)} />
      <Suspense fallback={<Loader label="Загрузка формы…" />}>
        {isGroupsOpen && <GroupManager onClose={() => setGroupsOpen(false)} />}
      </Suspense>
    </>
  );
}
