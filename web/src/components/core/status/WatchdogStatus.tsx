import { ShieldCheck } from "@/components/elements/icons";
import { WATCHDOG_LABELS, type IWatchdog } from "@/services/core/watchdog-types";
import { useTranslation } from "react-i18next";
export function WatchdogStatus({ watchdog }: { watchdog?: IWatchdog }) {
  const { t } = useTranslation();
  if (!watchdog) return null;
  return (
    <div className="watchdog-status" role="status">
      <ShieldCheck width={24} height={24} aria-hidden />
      <div>
        <strong>{t(WATCHDOG_LABELS[watchdog.state])}</strong>
        <span>{t(watchdog.message)}</span>
        {watchdog.attempt > 0 && (
          <small>
            {watchdog.attempt} / {watchdog.maxAttempts}
          </small>
        )}
      </div>
    </div>
  );
}
