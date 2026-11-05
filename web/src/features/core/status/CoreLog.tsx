import { useTranslation } from "react-i18next";
import { useState } from "react";
import { RefreshCw, Terminal } from "lucide-react";
import { useCore } from "@/features/core/model";
import { cn } from "@/shared/lib";
export function CoreLog() {
  const { t } = useTranslation();
  const query = useCore();
  const [isExpanded, setExpanded] = useState(false);
  return (
    <section
      className="card log-card"
      id="core-logs"
      data-scroll-section
      data-scroll-label={t("Журнал ядра")}
    >
      <div className="card-header">
        <div>
          <span className="eyebrow">{t("ДИАГНОСТИКА")}</span>
          <h2>
            <Terminal size={20} aria-hidden />
            {t("Журнал ядра")}
          </h2>
        </div>
        <div className="row-actions">
          <button className="text-btn" onClick={() => setExpanded(!isExpanded)} aria-expanded={isExpanded}>
            {isExpanded ? t("Свернуть") : t("Развернуть")}
          </button>
          <button
            className="icon-btn"
            aria-label={t("Обновить журнал")}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={20} aria-hidden />
          </button>
        </div>
      </div>
      <pre className={cn("logs", { "logs-expanded": isExpanded })}>
        {query.data?.logs || t("Пока нет записей. После запуска здесь появятся сообщения Hysteria2.")}
      </pre>
      <div className="log-footer">
        <span className="status-dot" />
        <span>{t("Последние сообщения процесса \u00B7 обновление автоматически")}</span>
      </div>
    </section>
  );
}
