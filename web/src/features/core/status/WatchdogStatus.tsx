import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import type { IWatchdog } from "@/features/core/model/watchdog-types";
import { WATCHDOG_LABELS } from "@/features/core/model/watchdog-types";
export function WatchdogStatus({ watchdog }: { watchdog?: IWatchdog }) {
  const { t } = useTranslation();
  if (!watchdog) return null;
  return (
    <div className="watchdog-status" role="status">
      <ShieldCheck size={20} aria-hidden />
      <div>
        <strong>{t(WATCHDOG_LABELS[watchdog.state])}</strong>
        <span>{t(watchdog.message)}</span>
        {watchdog.attempt > 0 && (
          <small>
            {watchdog.attempt} / {watchdog.maxAttempts}
          </small>
        )}
        {watchdog.lastError && <p className="inline-error">{t(watchdog.lastError)}</p>}
      </div>
    </div>
  );
}
