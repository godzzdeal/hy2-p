import { Notice } from "@/components/ui/feedback";
import { useCoreTools } from "@/hooks/configuration/tools/use-core-tools";
import { CopyButton } from "@/components/elements/copy";
import { useTranslation } from "react-i18next";
export function StatsSecret() {
  const { t } = useTranslation();
  const { stats } = useCoreTools();
  return (
    <section className="configuration-tools">
      <Notice>
        {t(
          "Панель задаёт trafficStats.listen и trafficStats.secret при запуске экземпляра. Ниже можно получить фактические значения панели.",
        )}
      </Notice>
      <button
        type="button"
        className="secondary"
        disabled={stats.isPending}
        onClick={() => (stats.data ? stats.reset() : stats.mutate())}
      >
        {t(stats.data ? "Скрыть секрет" : "Показать секрет Traffic Stats")}
      </button>
      {stats.data && (
        <>
          <p>
            {t("Адрес статистики")}: {stats.data.listen}
          </p>
          <p className="caption">
            {t(
              stats.data.running
                ? "Экземпляр запущен"
                : "Экземпляр остановлен. Значения применятся при запуске.",
            )}
          </p>
          <label>
            trafficStats.secret
            <input
              aria-label={t("Фактический секрет Traffic Stats")}
              readOnly
              value={stats.data.secret}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <CopyButton value={stats.data.secret} label="Скопировать секрет" />
        </>
      )}
      <p className="caption">
        {t(
          "Секрет может измениться после перезапуска панели. API статистики слушает loopback и не публикуется в интернет.",
        )}
      </p>
    </section>
  );
}
