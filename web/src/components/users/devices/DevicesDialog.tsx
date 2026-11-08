import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { Modal } from "@/components/ui/modal/Modal";
import { QueryState } from "@/components/ui/QueryState";
import { DeviceForm } from "@/components/users/devices/DeviceForm";
import { useDevices } from "@/hooks/users/devices/hooks";
import { type IUser } from "@/services/users/user-types";
import { useTranslation } from "react-i18next";
export function DevicesDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useDevices(user.id);
  return (
    <Modal title={t("Устройства пользователя")} onClose={onClose}>
      <p className="muted">
        <EmojiText value={t("Пользователь: {{name}}", { name: user.name })} />
      </p>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.error && <button onClick={() => void query.refetch()}>{t("Повторить")}</button>}
      {query.data && <DeviceForm userId={user.id} data={query.data} />}
    </Modal>
  );
}
