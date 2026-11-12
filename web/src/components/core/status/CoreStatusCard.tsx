import { Card } from "@/components/ui/cards/Card";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
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
    <Card
      className="engine-card overflow-hidden"
      id="core-status"
      data-scroll-section
      data-scroll-label={t("Состояние экземпляра")}
    >
      <div className="engine-summary grid grid-cols-toolbar items-center gap-4 p-4 max-tablet:p-4 max-tablet:gap-4 max-tablet:grid-cols-label">
        <span
          className={cn(
            "engine-symbol w-12 h-12 rounded-none grid place-items-center bg-input text-muted border border-line",
            { "engine-symbol-active bg-success-bg text-accent": isRunning },
          )}
        >
          <Activity width={24} height={24} aria-hidden />
        </span>
        <div>
          <h2>
            {query.isPending
              ? t("Проверяем состояние\u2026")
              : isRunning
                ? t("Сервер работает")
                : t("Сервер остановлен")}
          </h2>
          <p>
            {query.data?.available
              ? t("Экземпляр готов к работе.")
              : t("Установите экземпляр и настройте конфигурацию для первого запуска.")}
          </p>
        </div>
        <span
          className={cn(
            "engine-badge flex items-center gap-2 text-lg text-muted whitespace-nowrap max-tablet:col-start-2 max-tablet:justify-self-start",
            { "engine-badge-active text-accent": isRunning },
          )}
        >
          <span
            className={cn("connection-indicator inline-grid place-items-center", isRunning && "is-online")}
            aria-hidden
          />
          {isRunning ? t("В сети") : t("Не в сети")}
        </span>
      </div>
      <WatchdogStatus watchdog={query.data?.watchdog} />
      <QueryState isLoading={false} error={query.error} />
      <div className="engine-controls flex justify-between items-center gap-4 py-3 px-4 bg-input border-t border-line flex-wrap max-tablet:py-3 max-tablet:px-4">
        <Actions>
          <Button
            variant="primary"
            title={t("Запустить")}
            disabled={isBusy || !query.data?.available || isRunning}
            onClick={() => control.mutate("start")}
          >
            <Power width={24} height={24} aria-hidden />
            <span className="max-tablet:sr-only">{t("Запустить")}</span>
          </Button>
          <Button
            variant="secondary"
            title={t("Перезапустить")}
            disabled={isBusy || !isRunning}
            onClick={() => control.mutate("restart")}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            <span className="max-tablet:sr-only">{t("Перезапустить")}</span>
          </Button>
          <Button
            variant="outline"
            title={t("Остановить")}
            disabled={isBusy || (!isRunning && !watchdog?.desiredRunning)}
            onClick={() => control.mutate("stop")}
          >
            <Square width={24} height={24} aria-hidden />
            <span className="max-tablet:sr-only">{t("Остановить")}</span>
          </Button>
        </Actions>
        <span className="caption">
          {update.data?.busy ? t("Идёт операция с экземпляром") : t("Локальное управление процессом")}
        </span>
      </div>
    </Card>
  );
}
