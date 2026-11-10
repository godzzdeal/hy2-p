import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Caption } from "@/components/elements/Caption";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Actions } from "@/components/ui/Actions";
import { MemberRow } from "@/components/groups/members/MemberRow";
import { QueryState } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/Pagination";
import { useSetGroupMembers } from "@/hooks/groups/hooks";
import { useMemberSelection } from "@/hooks/groups/use-member-selection";
import { type IGroup } from "@/services/groups/types";
import { type FormEvent } from "react";
import { useTranslation } from "react-i18next";

export function GroupMembers({ group, onClose }: { group: IGroup; onClose: () => void }) {
  const { t } = useTranslation();
  const selection = useMemberSelection(group.id);
  const save = useSetGroupMembers();
  const isLoading = selection.groups.isPending || selection.users.isPending;
  const error = selection.groups.error || selection.users.error;
  const names = new Map(selection.groups.data?.groups?.map((item) => [item.id, item.name]));
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate({ groupId: group.id, userIds: selection.selected }, { onSuccess: onClose });
  }
  return (
    <form className="group-members" onSubmit={onSubmit}>
      <Caption>{t("Выберите участников. Пользователи из других групп будут перемещены.")}</Caption>
      <QueryState isLoading={isLoading} error={error} />
      <Fieldset className="contents" disabled={isLoading || !!error || save.isPending}>
        <Field>
          {t("Найти пользователя")}
          <Input
            type="search"
            value={selection.search}
            onChange={(event) => selection.onSearch(event.target.value)}
          />
        </Field>
        <div className="group-member-tools flex items-center justify-between gap-3 flex-wrap">
          <span>{t("Выбрано: {{count}}", { count: selection.selected.length })}</span>
          <Button type="button" variant="secondary" disabled={!selection.found} onClick={selection.onFound}>
            {t(selection.isFoundSelected ? "Снять найденные" : "Выбрать найденных")}
          </Button>
        </div>
        <div className="group-member-list grid gap-2 flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-stable p-1">
          {selection.visible.map((user) => (
            <MemberRow
              key={user.id}
              user={user}
              groupName={names.get(selection.groups.data?.memberships?.[user.id] ?? "")}
              isChecked={selection.selectedIds.has(user.id)}
              onToggle={selection.onToggle}
            />
          ))}
        </div>
        {!isLoading && !selection.found && <EmptyState>{t("Пользователи не найдены")}</EmptyState>}
        <Pagination page={selection.current} pageCount={selection.pageCount} onChange={selection.setPage} />
      </Fieldset>
      <Caption>
        {t("Снятая отметка убирает из группы. При лимите устройств обновите подписку в Happ.")}
      </Caption>
      <Actions>
        <Button type="button" variant="secondary" onClick={onClose} disabled={save.isPending}>
          {t("Назад")}
        </Button>
        <Button variant="primary" disabled={isLoading || !!error || save.isPending}>
          {t(save.isPending ? "Сохраняем…" : "Сохранить участников")}
        </Button>
      </Actions>
    </form>
  );
}
