import { useTranslation } from "react-i18next";
import { Modal, QueryState } from "@/shared/ui";
import { type IUser } from "@/features/users/model";
import { useDevices } from "./model";
import { DeviceForm } from "./DeviceForm";
export function DevicesDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useDevices(user.id);
  return (
    <Modal title={t("Устройства пользователя")} onClose={onClose}>
      <p className="muted">{t("Пользователь: {{name}}", { name: user.name })}</p>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.error && <button onClick={() => void query.refetch()}>{t("Повторить")}</button>}
      {query.data && <DeviceForm userId={user.id} data={query.data} />}
    </Modal>
  );
}
