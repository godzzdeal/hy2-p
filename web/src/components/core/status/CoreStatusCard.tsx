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
          <span className="eyebrow tracking-normal">HYSTERIA 2</span>
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
        <span
          className={cn(
            "engine-badge flex items-center gap-2 border border-line py-2 px-3 rounded-none text-lg text-muted whitespace-nowrap max-tablet:col-start-2 max-tablet:justify-self-start",
            { "engine-badge-active text-accent bg-success-bg": isRunning },
          )}
        >
          <i />
          {isRunning ? t("В сети") : t("Не в сети")}
        </span>
      </div>
      <WatchdogStatus watchdog={query.data?.watchdog} />
      <QueryState isLoading={false} error={query.error} />
      <div className="engine-controls flex justify-between items-center gap-4 py-3 px-4 bg-input border-t border-line flex-wrap max-tablet:py-3 max-tablet:px-4">
        <Actions>
          <Button
            variant="primary"
            disabled={isBusy || !query.data?.available || isRunning}
            onClick={() => control.mutate("start")}
          >
            <Power width={24} height={24} aria-hidden />
            {t("Запустить")}
          </Button>
          <Button
            variant="secondary"
            disabled={isBusy || !isRunning}
            onClick={() => control.mutate("restart")}
          >
            <RefreshCw width={24} height={24} aria-hidden />
            {t("Перезапустить")}
          </Button>
          <Button
            variant="outline"
            disabled={isBusy || (!isRunning && !watchdog?.desiredRunning)}
            onClick={() => control.mutate("stop")}
          >
            <Square width={24} height={24} aria-hidden />
            {t("Остановить")}
          </Button>
        </Actions>
        <span className="caption">
          {update.data?.busy ? t("Идёт операция с экземпляром") : t("Локальное управление процессом")}
        </span>
      </div>
    </Card>
  );
}
