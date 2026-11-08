import { GroupMembers } from "@/components/groups/members/GroupMembers";
import { Modal } from "@/components/ui/modal/Modal";
import { type IGroup } from "@/services/groups/types";
import { useTranslation } from "react-i18next";

export function GroupMembersDialog({ group, onClose }: { group: IGroup; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal
      className="group-members-dialog"
      title={t("Участники группы {{name}}", { name: group.name })}
      onClose={onClose}
    >
      <GroupMembers group={group} onClose={onClose} />
    </Modal>
  );
}
