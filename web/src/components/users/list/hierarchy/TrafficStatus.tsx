import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { useTranslation } from "react-i18next";

export function TrafficStatus() {
  const { t } = useTranslation();
  const traffic = useTraffic();
  return (
    <p className="traffic-note caption">
      {(traffic.error ? t(traffic.error.message) : t(traffic.data?.error ?? "")) ||
        (traffic.data?.updated
          ? t("Статистика: ") + new Date(traffic.data.updated).toLocaleTimeString()
          : t("Ожидание статистики экземпляра"))}
    </p>
  );
}
