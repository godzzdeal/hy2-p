import { CardBody } from "@/components/ui/cards/CardBody";
import { StorageList } from "@/components/admin/backups/storage";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { useTranslation } from "react-i18next";
export function BackupContent() {
  const { t } = useTranslation();
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
        <StorageList />
      </CardBody>
    </>
  );
}
