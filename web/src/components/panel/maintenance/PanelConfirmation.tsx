import { Caption } from "@/components/elements/Caption";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { type IPanelInstallation, type TPanelRequest } from "@/services/panel/maintenance";
import { formatDateTime } from "@/utils/format-date";
import { useTranslation } from "react-i18next";

interface IPanelConfirmation {
  input: TPanelRequest;
  installation: IPanelInstallation;
  onClose: () => void;
}
export function PanelConfirmation({ input, installation, onClose }: IPanelConfirmation) {
  const { t } = useTranslation();
  const operation = usePanelOperation();
  const isRollback = input.action === "rollback";
  const isCleanup = input.action === "cleanup";
  return (
    <Modal
      title={isCleanup ? "Удалить старые образы?" : isRollback ? "Откатить панель?" : "Обновить панель?"}
      onClose={onClose}
      isDismissible={!operation.isPending}
    >
      <p>
        {isCleanup
          ? t(
              "Останутся текущий образ, предыдущий для отката и образы, используемые контейнерами. Данные и резервные копии сохранятся.",
            )
          : isRollback
            ? t(
                "Восстановятся версия {{version}} и данные из копии от {{date}}. Текущее состояние будет сохранено отдельно.",
                {
                  version: installation.previous.replace(/^v/, ""),
                  date: formatDateTime(installation.backupCreated),
                },
              )
            : t(
                "Перед обновлением создаётся резервная копия. Если новая версия не запустится, панель вернёт прежнюю версию.",
              )}
      </p>
      {!isCleanup && (
        <Caption>{t("Подключения HY2 кратковременно прервутся. После завершения войдите снова.")}</Caption>
      )}
      <Actions className="mt-4">
        <Button type="button" variant="secondary" disabled={operation.isPending} onClick={onClose}>
          {t("Отмена")}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={operation.isPending}
          onClick={() => operation.mutate(input, { onSuccess: onClose })}
        >
          {t(
            operation.isPending ? "Запускаем…" : isCleanup ? "Удалить" : isRollback ? "Откатить" : "Обновить",
          )}
        </Button>
      </Actions>
    </Modal>
  );
}
