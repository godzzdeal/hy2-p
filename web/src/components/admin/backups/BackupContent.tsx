import { CardBody } from "@/components/ui/cards/CardBody";
import { QueryState } from "@/components/ui/loading";
import { BackupForm } from "@/components/admin/backups/BackupForm";
import { useBackups } from "@/hooks/admin/use-admin";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { useTranslation } from "react-i18next";
export function BackupContent() {
  const { t } = useTranslation();
  const model = useBackups();
  const operation = usePanelOperation();
  const isActive = usePanelOperationStore((state) => !!state.active);
  return (
    <>
      <CardBody>
        <Notice variant="warning">
          {t(
            "Создание копии кратковременно прерывает подключения. Архив содержит пароли, ключи и сертификаты.",
          )}
        </Notice>
        <Button
          variant="secondary"
          type="button"
          disabled={operation.isPending || isActive}
          onClick={() => operation.mutate({ action: "backup" })}
        >
          {t("Создать бэкап")}
        </Button>
        <QueryState isLoading={model.settings.isPending} error={model.settings.error} />
        {model.settings.data && <BackupForm initial={model.settings.data} save={model.save} />}
      </CardBody>
    </>
  );
}
