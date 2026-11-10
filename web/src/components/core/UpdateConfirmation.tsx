import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
import { useUpdateCommands } from "@/hooks/core/updates/use-updates";
import { useTranslation } from "react-i18next";
interface IUpdateConfirmation {
  mode: "install" | "rollback";
  version: string;
  onClose: () => void;
}
export function UpdateConfirmation({ mode, version, onClose }: IUpdateConfirmation) {
  const { t } = useTranslation();
  const commands = useUpdateCommands();
  const isRollback = mode === "rollback";
  const isPending = commands.install.isPending || commands.rollback.isPending;
  function onConfirm() {
    if (isRollback) commands.rollback.mutate(undefined, { onSuccess: onClose });
    else commands.install.mutate(version, { onSuccess: onClose });
  }
  return (
    <Modal
      title={isRollback ? t("Вернуться к предыдущей версии?") : t("Установить новую версию?")}
      onClose={onClose}
    >
      <p>
        {t("Версия:")}
        <strong>{version.replace("app/", "")}</strong>
      </p>
      <p className="muted">
        {t(
          "Подключения кратковременно прервутся. Панель проверит запуск и локальный API экземпляра. При ошибке она попытается автоматически восстановить предыдущий экземпляр.",
        )}
      </p>
      <p className="muted">
        {t(
          "Для проверки нужен рабочий TLS-конфиг. Даже остановленный экземпляр будет запущен на время проверки, затем остановлен снова.",
        )}
      </p>
      <div className="dialog-actions flex justify-end gap-3 mt-3 flex-wrap">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          {t("Отмена")}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isPending}>
          {isPending ? t("Подготовка\u2026") : isRollback ? t("Выполнить откат") : t("Установить")}
        </Button>
      </div>
    </Modal>
  );
}
