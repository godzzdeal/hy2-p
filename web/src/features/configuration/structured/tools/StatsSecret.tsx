import { useTranslation } from "react-i18next";
import { useUiStore } from "@/app/state";
import { useCoreTools, copyValue } from "./model";
export function StatsSecret() {
  const { t } = useTranslation();
  const { stats } = useCoreTools();
  const { notify, showError } = useUiStore();
  return (
    <section className="configuration-tools">
      <p className="config-note">
        {t(
          "Панель задаёт trafficStats.listen и trafficStats.secret при запуске ядра. Ниже можно получить фактические значения панели.",
        )}
      </p>
      <button
        type="button"
        className="secondary"
        disabled={stats.isPending}
        onClick={() => (stats.data ? stats.reset() : stats.mutate())}
      >
        {t(stats.data ? "Скрыть секрет" : "Показать секрет Traffic Stats")}
      </button>
      {stats.error && (
        <p role="alert" className="inline-error">
          {t(stats.error.message)}
        </p>
      )}
      {stats.data && (
        <>
          <p>
            {t("Адрес статистики")}: {stats.data.listen}
          </p>
          <p className="caption">
            {t(stats.data.running ? "Ядро запущено" : "Ядро остановлено. Значения применятся при запуске.")}
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
          <button
            type="button"
            className="secondary"
            onClick={() =>
              void copyValue(stats.data!.secret)
                .then(() => notify("Скопировано"))
                .catch(showError)
            }
          >
            {t("Скопировать секрет")}
          </button>
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
