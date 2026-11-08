import { Plus } from "@/components/elements/icons";
import { GroupEditor } from "@/components/groups/editor/GroupEditor";
import { GroupRow } from "@/components/groups/manage/GroupRow";
import { GroupMembers } from "@/components/groups/members/GroupMembers";
import { useUsers } from "@/hooks/users/user-queries";
import { groupUsers } from "@/services/groups/membership";
import { EMPTY_GROUPS } from "@/services/groups/types";
import { Modal } from "@/components/ui/modal/Modal";
import { QueryState } from "@/components/ui/QueryState";
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
      className={cn({ "group-members-dialog": !!members })}
      title={members ? t("Участники группы {{name}}", { name: members.name }) : t("Группы пользователей")}
      onClose={onClose}
    >
      {members ? (
        <GroupMembers group={members} onClose={() => setMembers(undefined)} />
      ) : isEditing ? (
        <GroupEditor group={group} onClose={() => setEditing(false)} />
      ) : (
        <>
          <p className="caption">
            {t(
              "Объединяйте пользователей и задавайте общие ядра, лимиты трафика и устройств. Каждый пользователь может состоять в одной группе.",
            )}
          </p>
          <QueryState isLoading={query.isPending} error={query.error} />
          {query.error && (
            <button className="secondary" onClick={() => void query.refetch()}>
              {t("Повторить")}
            </button>
          )}
          <button
            type="button"
            className="primary"
            disabled={!query.data || !!query.error}
            onClick={() => {
              setGroup(undefined);
              setEditing(true);
            }}
          >
            <Plus width={24} height={24} aria-hidden />
            {t("Создать группу")}
          </button>
          <ul className="group-list">
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
            <p className="empty">{t("Групп пока нет. Создайте первую и добавьте в неё пользователей.")}</p>
          )}
        </>
      )}
    </Modal>
  );
}
