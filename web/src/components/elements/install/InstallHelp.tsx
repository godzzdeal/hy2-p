import { Notice } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/overlays/Modal";
import { useTranslation } from "react-i18next";
export function InstallHelp({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal title="Панель на главном экране" onClose={onClose}>
      <Notice variant="warning">
        {t("Для установки откройте панель по HTTPS с действительным сертификатом.")}
      </Notice>
      <h3>iPhone / iPad</h3>
      <ol className="install-steps mt-3 mb-5 pl-6">
        <li>{t("Откройте панель в Safari и нажмите «Поделиться».")}</li>
        <li>
          {t(
            "Выберите «На экран Домой». Если есть переключатель «Открывать как веб-приложение», включите его.",
          )}
        </li>
        <li>{t("Нажмите «Добавить».")}</li>
      </ol>
      <h3>Android</h3>
      <ol className="install-steps mt-3 mb-5 pl-6">
        <li>{t("Откройте панель в Chrome.")}</li>
        <li>{t("В меню браузера выберите «Установить приложение» или «Добавить на главный экран».")}</li>
        <li>{t("Подтвердите установку.")}</li>
      </ol>
      <p className="muted">{t("Для работы панели нужен доступ к серверу через интернет.")}</p>
    </Modal>
  );
}
