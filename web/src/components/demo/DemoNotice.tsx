import { RefreshCw } from "@/components/elements/icons";
import { DEFAULT_INSTANCE } from "@/services/instances/types";
import { useInstanceStore } from "@/store/core/instance-store";
import { useTranslation } from "react-i18next";
export function DemoNotice() {
  const { t } = useTranslation();
  function onReset() {
    useInstanceStore.getState().setId(DEFAULT_INSTANCE);
    window.location.reload();
  }
  return (
    <aside className="demo-notice" aria-label={t("Демоверсия")}>
      <div>
        <strong>{t("HY2-P Demo")}</strong>
        <p>
          {t(
            "Попробуйте панель. Данные учебные, изменения видны только в этой вкладке. VPN не подключается.",
          )}
        </p>
        <small>{t("Вход: demo / demo. Перезагрузка сбрасывает пример.")}</small>
      </div>
      <button type="button" className="secondary" onClick={onReset}>
        <RefreshCw width={24} height={24} aria-hidden />
        {t("Сбросить пример")}
      </button>
    </aside>
  );
}
