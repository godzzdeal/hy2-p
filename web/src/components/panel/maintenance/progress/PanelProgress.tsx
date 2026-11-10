import { Loader } from "@/components/ui/loading";
import { usePanelProgress } from "@/hooks/panel/maintenance";
import { useTranslation } from "react-i18next";

export function PanelProgress() {
  const { t } = useTranslation();
  const { active, query, onReload } = usePanelProgress();
  if (!active) return null;
  const result = query.data;
  const isBusy = !result || result.busy;
  const message = query.error
    ? "Восстанавливаем связь с панелью. Проверка продолжается."
    : result?.message || "Подготавливаем обслуживание панели";
  return (
    <aside className="port-operation panel-operation" aria-label={t("Обслуживание панели")}>
      {isBusy ? <Loader label={message} isInline /> : <p role="status">{t(message)}</p>}
      {!isBusy && (
        <button type="button" className="primary" onClick={onReload}>
          {t("Открыть панель")}
        </button>
      )}
    </aside>
  );
}
