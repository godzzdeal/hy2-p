import { WatchdogStatus } from "@/components/core/status/WatchdogStatus";
import { Activity, Power, RefreshCw, Square } from "@/components/elements/icons";
import { QueryState } from "@/components/ui/loading";
import { useUpdateStatus } from "@/hooks/core/updates/use-updates";
import { useCore, useCoreControl } from "@/hooks/core/use-core";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
export function CoreStatusCard() {
  const { t } = useTranslation();
  const query = useCore();
  const control = useCoreControl();
  const update = useUpdateStatus();
  const isRunning = query.data?.running === true;
  const watchdog = query.data?.watchdog;
  const isBusy =
    control.isPending ||
    update.data?.busy === true ||
    watchdog?.state === "restarting" ||
    watchdog?.state === "rolling_back";
  return (
    <section
      className="card engine-card"
      id="core-status"
      data-scroll-section
      data-scroll-label={t("Состояние экземпляра")}
    >
      <div className="engine-summary">
        <span className={cn("engine-symbol", { "engine-symbol-active": isRunning })}>
          <Activity width={24} height={24} aria-hidden />
        </span>
        <div>
          <span className="eyebrow">HYSTERIA 2</span>
          <h2>
            {query.isPending
              ? t("Проверяем состояние\u2026")
              : isRunning
                ? t("Сервер работает")
                : t("Сервер остановлен")}
          </h2>
          <p>
            {query.data?.available
              ? t("Экземпляр готов к работе. Управляйте запуском и версиями ниже.")
              : t("Установите экземпляр и настройте конфигурацию для первого запуска.")}
          </p>
        </div>
        <span className={cn("engine-badge", { "engine-badge-active": isRunning })}>
          <i />
          {isRunning ? t("В сети") : t("Не в сети")}
        </span>
      </div>
      <WatchdogStatus watchdog={query.data?.watchdog} />
      <QueryState isLoading={false} error={query.error} />
      <div className="engine-controls">
        <div className="row-actions">
          <button
            className="primary"
            disabled={isBusy || !query.data?.available || isRunning}
            onClick={() => control.mutate("start")}
          >
            <Power width={24} height={24} aria-hidden />
            {t("Запустить")}
          </button>
          <button
            className="secondary"
            disabled={isBusy || !isRunning}
            onClick={() => control.mutate("restart")}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            {t("Перезапустить")}
          </button>
          <button
            className="text-btn"
            disabled={isBusy || (!isRunning && !watchdog?.desiredRunning)}
            onClick={() => control.mutate("stop")}
          >
            <Square width={24} height={24} aria-hidden />
            {t("Остановить")}
          </button>
        </div>
        <span className="caption">
          {update.data?.busy ? t("Идёт операция с экземпляром") : t("Локальное управление процессом")}
        </span>
      </div>
    </section>
  );
}
