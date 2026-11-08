import { useTranslation } from "react-i18next";
import { Modal, QueryState } from "@/shared/ui";
import { type IUser } from "@/features/users/model";
import { useInstances } from "@/features/instances/data";
import { useUserAccess } from "./model";
import { AccessForm } from "./AccessForm";
import { EmojiText } from "@/shared/emoji";
import { useGroups } from "@/features/groups";
export function UserAccessDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const access = useUserAccess(user.id);
  const cores = useInstances();
  const groups = useGroups();
  const group = groups.data?.groups?.find((item) => item.id === groups.data?.memberships?.[user.id]);
  return (
    <Modal title={t("Доступные ядра")} onClose={onClose}>
      <p className="muted">
        <EmojiText value={t("Пользователь: {{name}}", { name: user.name })} />
      </p>
      {group && (
        <p className="config-note">
          {t("Группа дополнительно ограничивает доступные ядра:")} {group.name}
        </p>
      )}
      <QueryState isLoading={access.isPending || cores.isPending} error={access.error || cores.error} />
      {(access.error || cores.error) && (
        <button onClick={() => void Promise.all([access.refetch(), cores.refetch()])}>
          {t("Повторить")}
        </button>
      )}
      {access.data && cores.data && !access.error && !cores.error && (
        <AccessForm userId={user.id} initial={access.data} instances={cores.data} onSaved={onClose} />
      )}
    </Modal>
  );
}
