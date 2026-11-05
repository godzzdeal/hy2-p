import { useTranslation } from "react-i18next";
import { formatBytes } from "./model";
import type { IUserUsage } from "./model";
export function UsageCell({ usage }: { usage: IUserUsage }) {
  const { t } = useTranslation();
  return (
    <div className="usage-cell">
      <strong>{formatBytes(usage.upload + usage.download)}</strong>
      <small>{usage.limit > 0 ? "/ " + formatBytes(usage.limit) : t("Без лимита")}</small>
      {usage.limit > 0 && (
        <meter
          min={0}
          max={usage.limit}
          value={Math.min(usage.limit, usage.upload + usage.download)}
          aria-label={t("Использование лимита трафика")}
        />
      )}
    </div>
  );
}
