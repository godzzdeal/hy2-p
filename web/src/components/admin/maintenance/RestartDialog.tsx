import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/overlays/Modal";
import { Loader } from "@/components/ui/loading";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { useTranslation } from "react-i18next";

export function RestartDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const restart = usePanelOperation();
  return (
    <Modal title="Перезапустить панель?" isDismissible={!restart.isPending} onClose={onClose}>
      <p>{t("Подключения HY2 кратковременно прервутся. Настройки и пользователи сохранятся.")}</p>
      <p>{t("После перезапуска войдите снова.")}</p>
      {restart.isPending && <Loader label="Панель перезапускается…" />}
      <Actions className="mt-4">
        <Button type="button" variant="secondary" disabled={restart.isPending} onClick={onClose}>
          {t("Отмена")}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={restart.isPending}
          onClick={() => restart.mutate({ action: "restart" }, { onSuccess: onClose })}
        >
          {t("Перезапустить")}
        </Button>
      </Actions>
    </Modal>
  );
}
