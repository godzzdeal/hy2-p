import { trafficLimit, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { formatUsage } from "@/services/users/traffic/byte-format";
import { useTranslation } from "react-i18next";
export function UsageCell({ usage }: { usage: IUserUsage }) {
  const { t, i18n } = useTranslation();
  const limit = trafficLimit(usage);
  return (
    <div className="usage-cell grid gap-1 min-w-32">
      <strong className="whitespace-nowrap" title={limit > 0 ? undefined : t("Без лимита")}>
        {formatUsage(usage.upload + usage.download, limit, t, i18n.language)}
      </strong>
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
