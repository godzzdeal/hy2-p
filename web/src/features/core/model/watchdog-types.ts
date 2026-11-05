export interface IWatchdog {
  desiredRunning: boolean;
  state: "idle" | "watching" | "backoff" | "restarting" | "rolling_back" | "failed";
  attempt: number;
  maxAttempts: number;
  message: string;
  lastCrash: string;
  lastError: string;
  nextRetry: string;
}
export const WATCHDOG_LABELS: Record<IWatchdog["state"], string> = {
  idle: "Watchdog ожидает запуска",
  watching: "Watchdog активен",
  backoff: "Ожидание перезапуска",
  restarting: "Watchdog перезапускает ядро",
  rolling_back: "Watchdog откатывает версию",
  failed: "Требуется вмешательство",
};
