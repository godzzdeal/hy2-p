import { Button } from "@/components/ui/button/Button";
import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { Modal } from "@/components/ui/overlays/Modal";
import { useUserCommands } from "@/hooks/users/user-queries";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export function DeleteDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const { remove } = useUserCommands();
  return (
    <Modal title={t("Удалить пользователя?")} onClose={onClose}>
      <p>
        {t("Пользователь \u00AB")}
        <EmojiText value={user.displayName ?? user.name} />
        {t("\u00BB и его подписка будут удалены без возможности восстановления.")}
      </p>
      <Button
        aria-label={t("Удалить пользователя")}
        className="full w-full"
        variant="primary"
        disabled={remove.isPending}
        onClick={() => remove.mutate(user.id, { onSuccess: onClose })}
      >
        {remove.isPending ? t("Удаляем\u2026") : t("Удалить")}
      </Button>
    </Modal>
  );
}
