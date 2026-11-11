import { Caption } from "@/components/elements/Caption";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { Button } from "@/components/ui/button/Button";
import { Plus } from "@/components/elements/icons";
import { GroupEditor } from "@/components/groups/editor/GroupEditor";
import { GroupRow } from "@/components/groups/manage/GroupRow";
import { GroupMembers } from "@/components/groups/members/GroupMembers";
import { useUsers } from "@/hooks/users/user-queries";
import { groupUsers } from "@/services/groups/membership";
import { EMPTY_GROUPS } from "@/services/groups/types";
import { Modal } from "@/components/ui/overlays/Modal";
import { QueryState } from "@/components/ui/loading";
import { useGroups } from "@/hooks/groups/hooks";
import { type IGroup } from "@/services/groups/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
export function GroupManager({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const query = useGroups();
  const [isEditing, setEditing] = useState(false);
  const [group, setGroup] = useState<IGroup>();
  const [members, setMembers] = useState<IGroup>();
  const users = useUsers();
  const counts = new Map(
    groupUsers(users.data ?? [], query.data ?? EMPTY_GROUPS).map((section) => [section.id, section.total]),
  );
  return (
    <Modal
      className={cn({
        "group-members-dialog flex flex-col w-160 shrink-0": !!members,
      })}
      title={members ? t("Участники группы {{name}}", { name: members.name }) : t("Группы пользователей")}
      onClose={onClose}
    >
      {members ? (
        <GroupMembers group={members} onClose={() => setMembers(undefined)} />
      ) : isEditing ? (
        <GroupEditor group={group} onClose={() => setEditing(false)} />
      ) : (
        <>
          <Caption>
            {t(
              "Объединяйте пользователей и задавайте общие экземпляры, лимиты трафика и устройств. Каждый пользователь может состоять в одной группе.",
            )}
          </Caption>
          <QueryState isLoading={query.isPending} error={query.error} />
          {query.error && (
            <Button variant="secondary" onClick={() => void query.refetch()}>
              {t("Повторить")}
            </Button>
          )}
          <Button
            aria-label={t("Создать группу")}
            type="button"
            variant="primary"
            disabled={!query.data || !!query.error}
            onClick={() => {
              setGroup(undefined);
              setEditing(true);
            }}
          >
            <Plus width={24} height={24} aria-hidden />
            {t("Создать")}
          </Button>
          <ul className="group-list list-none p-0 grid gap-2">
            {query.data?.groups?.map((item) => (
              <GroupRow
                key={item.id}
                group={item}
                members={counts.get(item.id) ?? 0}
                onMembers={() => setMembers(item)}
                onEdit={() => {
                  setGroup(item);
                  setEditing(true);
                }}
              />
            ))}
          </ul>
          {query.data?.groups?.length === 0 && (
            <EmptyState>{t("Групп пока нет. Создайте первую и добавьте в неё пользователей.")}</EmptyState>
          )}
        </>
      )}
    </Modal>
  );
}
