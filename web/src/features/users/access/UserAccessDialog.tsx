import { useTranslation } from "react-i18next";
import { Modal, QueryState } from "@/shared/ui";
import { type IUser } from "@/features/users/model";
import { useInstances } from "@/features/instances/data";
import { useUserAccess } from "./model";
import { AccessForm } from "./AccessForm";
export function UserAccessDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const access = useUserAccess(user.id);
  const cores = useInstances();
  return (
    <Modal title={t("Доступные ядра")} onClose={onClose}>
      <p className="muted">{t("Пользователь: {{name}}", { name: user.name })}</p>
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
