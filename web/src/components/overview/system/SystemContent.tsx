import { MetricChart } from "@/components/overview/system/charts";
import { StorageCard } from "@/components/overview/system/storage";
import { TrafficCard } from "@/components/overview/system/TrafficCard";
import { type ISystemMetrics } from "@/services/admin/maintenance";
import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";

interface ISystemContent {
  data: ISystemMetrics;
  traffic: { upload: number; download: number; isAvailable: boolean };
}
export function SystemContent({ data, traffic }: ISystemContent) {
  const { t } = useTranslation();
  const current = data.samples.at(-1);
  return (
    <>
      {!data.available && <p className="empty">{t(data.error || "Системные показатели недоступны")}</p>}
      {data.available && (
        <div className="system-grid">
          <MetricChart
            title="CPU"
            samples={data.samples}
            field="cpu"
            value={(current?.cpu ?? 0).toFixed(1) + "%"}
            maximum={100}
          />
          <MetricChart
            title="Память"
            samples={data.samples}
            field="memory"
            value={formatBytes(data.memoryUsed, t) + " / " + formatBytes(data.memoryTotal, t)}
            maximum={100}
          />
          <MetricChart
            title="Нагрузка"
            samples={data.samples}
            field="load"
            value={(current?.load ?? 0).toFixed(2) + " / " + data.cpus + " CPU"}
          />
          <MetricChart
            title={data.scope === "host" ? "Сеть сервера" : "Сеть контейнера"}
            samples={data.samples}
            field="receive"
            secondary="transmit"
            value={
              "↓ " +
              formatBytes(Math.round(current?.receive ?? 0), t) +
              t("/с") +
              " ↑ " +
              formatBytes(Math.round(current?.transmit ?? 0), t) +
              t("/с")
            }
          />
        </div>
      )}
      <div className="system-grid">
        <StorageCard value={data.storage} isHost={data.storage.managed} />
        <TrafficCard {...traffic} received={data.received} transmitted={data.transmitted} />
      </div>
    </>
  );
}
