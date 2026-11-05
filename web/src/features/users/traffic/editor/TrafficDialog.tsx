import { useTranslation } from "react-i18next";
import type { IUser } from "@/features/users/model";
import { Modal, QueryState } from "@/shared/ui";
import { EMPTY_USAGE, useTraffic } from "../model";
import { TrafficForm } from "./TrafficForm";
export function TrafficDialog({ user, onClose }: { user: IUser; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useTraffic();
  return (
    <Modal title={t("Трафик · ") + user.name} onClose={onClose}>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && (
        <TrafficForm user={user} usage={query.data.users[user.id] ?? EMPTY_USAGE} onClose={onClose} />
      )}
    </Modal>
  );
}
