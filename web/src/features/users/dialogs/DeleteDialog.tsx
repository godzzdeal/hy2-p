import { EmojiText } from "@/shared/emoji";
import { useTranslation } from "react-i18next";
import { type IUser } from "@/features/users/model";
import { useUserCommands } from "@/features/users/model";
import { Modal } from "@/shared/ui";
export function DeleteDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const { remove } = useUserCommands();
  return (
    <Modal title={t("Удалить пользователя?")} onClose={onClose}>
      <p>
        {t("Пользователь \u00AB")}
        <EmojiText value={user.name} />
        {t("\u00BB и его подписка будут удалены без возможности восстановления.")}
      </p>
      <button
        className="primary full delete-button"
        disabled={remove.isPending}
        onClick={() => remove.mutate(user.id, { onSuccess: onClose })}
      >
        {remove.isPending ? t("Удаляем\u2026") : t("Удалить пользователя")}
      </button>
    </Modal>
  );
}
