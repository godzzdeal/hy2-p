import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { Modal } from "@/components/ui/overlays/Modal";
import { QueryState } from "@/components/ui/loading";
import { AccessForm } from "@/components/users/access/AccessForm";
import { useGroups } from "@/hooks/groups/hooks";
import { useInstances } from "@/hooks/instances/use-instances";
import { useUserAccess } from "@/hooks/users/access/hooks";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export function UserAccessDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const access = useUserAccess(user.id);
  const cores = useInstances();
  const groups = useGroups();
  const group = groups.data?.groups?.find((item) => item.id === groups.data?.memberships?.[user.id]);
  return (
    <Modal title={t("Доступные экземпляры")} onClose={onClose}>
      <p className="muted">
        <EmojiText value={t("Пользователь: {{name}}", { name: user.displayName ?? user.name })} />
      </p>
      {group && (
        <Notice>
          {t("Группа дополнительно ограничивает доступные экземпляры:")} {group.name}
        </Notice>
      )}
      <QueryState isLoading={access.isPending || cores.isPending} error={access.error || cores.error} />
      {(access.error || cores.error) && (
        <Button onClick={() => void Promise.all([access.refetch(), cores.refetch()])}>
          {t("Повторить")}
        </Button>
      )}
      {access.data && cores.data && !access.error && !cores.error && (
        <AccessForm userId={user.id} initial={access.data} instances={cores.data} onSaved={onClose} />
      )}
    </Modal>
  );
}
