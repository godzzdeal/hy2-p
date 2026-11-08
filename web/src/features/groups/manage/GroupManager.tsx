import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, QueryState } from "@/shared/ui";
import { Plus } from "@/shared/icons";
import { useGroups, type IGroup } from "../model";
import { GroupEditor } from "../editor";
import { GroupRow } from "./GroupRow";
export function GroupManager({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const query = useGroups();
  const [isEditing, setEditing] = useState(false);
  const [group, setGroup] = useState<IGroup>();
  return (
    <Modal title={t("Группы пользователей")} onClose={onClose}>
      {isEditing ? (
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
                members={Object.values(query.data?.memberships ?? {}).filter((id) => id === item.id).length}
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
