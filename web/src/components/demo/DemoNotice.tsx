import { Button } from "@/components/ui/button/Button";
import { RefreshCw } from "@/components/elements/icons";
import { DEFAULT_INSTANCE } from "@/services/instances/types";
import { PAGE_ROUTES, PageEnum } from "@/config/navigation";
import { useInstanceStore } from "@/store/core/instance-store";
import { useTranslation } from "react-i18next";
export function DemoNotice() {
  const { t } = useTranslation();
  function onReset() {
    useInstanceStore.getState().setId(DEFAULT_INSTANCE);
    window.location.assign(PAGE_ROUTES[PageEnum.Overview]);
  }
  return (
    <aside
      className="demo-notice flex items-center justify-between gap-4 p-4 border border-l-4 border-accent bg-surface-soft flex-wrap min-w-0 my-2 mx-0 text-pretty text-muted shrink-0"
      aria-label={t("Демоверсия")}
    >
      <div>
        <strong>{t("HY2-P Demo")}</strong>
        <p>{t("Демоверсия. Изменения видны только в этой вкладке. VPN недоступен.")}</p>
        <small>{t("Вход: demo / demo. Перезагрузка сбрасывает пример.")}</small>
      </div>
      <Button type="button" variant="secondary" onClick={onReset}>
        <RefreshCw width={24} height={24} aria-hidden />
        {t("Сбросить пример")}
      </Button>
    </aside>
  );
}
