import { useTranslation } from "react-i18next";
import { formatBytes, trafficLimit } from "./model";
import { type IUserUsage } from "./model";
export function UsageCell({ usage }: { usage: IUserUsage }) {
  const { t } = useTranslation();
  const limit = trafficLimit(usage);
  return (
    <div className="usage-cell">
      <strong>{formatBytes(usage.upload + usage.download, t)}</strong>
      <small>{limit > 0 ? "/ " + formatBytes(limit, t) : t("Без лимита")}</small>
      {limit > 0 && (
        <meter
          min={0}
          max={limit}
          value={Math.min(limit, usage.upload + usage.download)}
          aria-label={t("Использование лимита трафика")}
        />
      )}
    </div>
  );
}
