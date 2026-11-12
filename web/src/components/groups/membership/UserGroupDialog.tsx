import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
import { QueryState } from "@/components/ui/loading";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useAssignGroup, useGroups } from "@/hooks/groups/hooks";
import { GROUP_FILTERS } from "@/services/groups/types";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
export function UserGroupDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useGroups();
  const [groupId, setGroupId] = useState(query.data?.memberships?.[userId] ?? GROUP_FILTERS.ungrouped);
  const assign = useAssignGroup();
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    assign.mutate(
      { userId, groupId: groupId === GROUP_FILTERS.ungrouped ? "" : groupId },
      { onSuccess: onClose },
    );
  }
  return (
    <Modal title={t("Группа пользователя")} onClose={onClose}>
      <QueryState isLoading={query.isPending} error={query.error} />
      <form className="group-assignment" onSubmit={onSubmit}>
        <Field>
          {t("Группа")}
          <Select
            value={groupId}
            onValueChange={setGroupId}
            disabled={!query.data || !!query.error || assign.isPending}
          >
            <SelectOption value={GROUP_FILTERS.ungrouped}>{t("Без группы")}</SelectOption>
            {query.data?.groups?.map((group) => (
              <SelectOption key={group.id} value={group.id}>
                {group.name}
              </SelectOption>
            ))}
          </Select>
        </Field>
        <Caption>
          {t(
            "Ограничения группы действуют вместе с личными. Смена группы перезапустит подключение. Если включён лимит устройств, обновите подписку в приложении.",
          )}
        </Caption>
        <Button
          aria-label={t("Сохранить группу")}
          className="full w-full"
          variant="primary"
          disabled={!query.data || !!query.error || assign.isPending}
        >
          {t(assign.isPending ? "Сохраняем…" : "Сохранить")}
        </Button>
      </form>
    </Modal>
  );
}
