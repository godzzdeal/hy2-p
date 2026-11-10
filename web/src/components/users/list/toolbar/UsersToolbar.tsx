import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { RefreshCw } from "@/components/elements/icons";
import { UserCount } from "@/components/users/list/toolbar/UserCount";
import { useUsersRefresh } from "@/hooks/users/list/toolbar/use-users-refresh";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
export function UsersToolbar({
  search,
  onSearch,
  found,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  found: number;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const refresh = useUsersRefresh();
  return (
    <CardHeader className="users-toolbar flex-wrap max-tablet:items-stretch max-tablet:flex-col">
      <h2>
        {t("Пользователи")}
        <UserCount />
      </h2>
      <div className="users-list-actions flex items-center justify-end flex-1 flex-wrap gap-3 min-w-0 max-tablet:justify-start">
        {children}
        <Field className="users-search m-0 flex-1 min-w-40 max-w-60 max-tablet:basis-full max-tablet:max-w-none">
          <span className="sr-only">{t("Поиск пользователей")}</span>
          <Input
            type="search"
            value={search}
            placeholder={t("Поиск по имени…")}
            onChange={(event) => onSearch(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          variant="secondary"
          disabled={refresh.isPending}
          aria-busy={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          <RefreshCw width={24} height={24} aria-hidden />
          {t(refresh.isPending ? "Обновляем…" : "Обновить")}
        </Button>
        <span className="users-found text-muted" role="status">
          {t("Найдено: {{count}}", { count: found })}
        </span>
      </div>
    </CardHeader>
  );
}
