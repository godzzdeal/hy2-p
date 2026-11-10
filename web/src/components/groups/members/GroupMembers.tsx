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
      <p className="caption">{t("Выберите участников. Пользователи из других групп будут перемещены.")}</p>
      <QueryState isLoading={isLoading} error={error} />
      <fieldset disabled={isLoading || !!error || save.isPending}>
        <label>
          {t("Найти пользователя")}
          <input
            type="search"
            value={selection.search}
            onChange={(event) => selection.onSearch(event.target.value)}
          />
        </label>
        <div className="group-member-tools">
          <span>{t("Выбрано: {{count}}", { count: selection.selected.length })}</span>
          <button type="button" className="secondary" disabled={!selection.found} onClick={selection.onFound}>
            {t(selection.isFoundSelected ? "Снять найденные" : "Выбрать найденных")}
          </button>
        </div>
        <div className="group-member-list">
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
        {!isLoading && !selection.found && <p className="empty">{t("Пользователи не найдены")}</p>}
        <Pagination page={selection.current} pageCount={selection.pageCount} onChange={selection.setPage} />
      </fieldset>
      <p className="caption">
        {t("Снятая отметка убирает из группы. При лимите устройств обновите подписку в Happ.")}
      </p>
      <div className="row-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={save.isPending}>
          {t("Назад")}
        </button>
        <button className="primary" disabled={isLoading || !!error || save.isPending}>
          {t(save.isPending ? "Сохраняем…" : "Сохранить участников")}
        </button>
      </div>
    </form>
  );
}
