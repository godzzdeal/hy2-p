import { Modal } from "@/components/ui/modal/Modal";
import { Loader } from "@/components/ui/loading";
import { usePanelRestart } from "@/hooks/admin/maintenance";
import { useTranslation } from "react-i18next";

export function RestartDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const restart = usePanelRestart();
  return (
    <Modal title="Перезапустить панель?" isDismissible={!restart.isPending} onClose={onClose}>
      <p>{t("Подключения HY2 кратковременно прервутся. Настройки и пользователи сохранятся.")}</p>
      <p>{t("После перезапуска войдите снова.")}</p>
      {restart.isPending && <Loader label="Панель перезапускается…" />}
      <div className="row-actions mt-4">
        <button type="button" className="secondary" disabled={restart.isPending} onClick={onClose}>
          {t("Отмена")}
        </button>
        <button
          type="button"
          className="primary"
          disabled={restart.isPending}
          onClick={() => restart.mutate(undefined, { onSuccess: onClose })}
        >
          {t("Перезапустить")}
        </button>
      </div>
    </Modal>
  );
}
