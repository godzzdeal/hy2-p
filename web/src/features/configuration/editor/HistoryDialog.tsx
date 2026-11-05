import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { type IConfiguration } from "@/features/configuration/model";
import { configurationApi } from "@/features/configuration/model";
import { QUERY_KEYS } from "@/shared/http";
import { Modal, QueryState } from "@/shared/ui";
import { RevisionRow } from "@/features/configuration/RevisionRow";
export function HistoryDialog({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const history = useQuery({
    queryKey: QUERY_KEYS.history,
    queryFn: configurationApi.history,
  });
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
