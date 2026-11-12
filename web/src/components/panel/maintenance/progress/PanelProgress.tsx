import { Button } from "@/components/ui/button/Button";
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
    <aside
      className="port-operation fixed p-4 border border-line rounded-none bg-surface text-foreground shadow-popup z-20 text-xl max-tablet:bottom-16 items-center panel-operation grid gap-3"
      aria-label={t("Обслуживание панели")}
    >
      {isBusy ? <Loader label={message} isInline /> : <p role="status">{t(message)}</p>}
      {active.targetURL && (
        <a href={active.targetURL}>
          {t("Открыть новый адрес")}: {active.targetURL}
        </a>
      )}
      {!isBusy && (
        <Button type="button" variant="primary" onClick={onReload}>
          {t("Открыть панель")}
        </Button>
      )}
    </aside>
  );
}
