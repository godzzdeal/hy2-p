import { RevisionRow } from "@/components/configuration/RevisionRow";
import { Modal } from "@/components/ui/modal/Modal";
import { QueryState } from "@/components/ui/QueryState";
import { useHistory } from "@/hooks/configuration/use-history";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
export function HistoryDialog({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <Modal title={t("История конфигурации")} onClose={onClose}>
      <QueryState isLoading={history.isPending} error={history.error} />
      {history.data?.map((revision) => (
        <RevisionRow key={revision.id} revision={revision} onRestore={onRestore} />
      ))}
      {history.data?.length === 0 && <p className="muted">{t("Предыдущих версий пока нет.")}</p>}
    </Modal>
  );
}
