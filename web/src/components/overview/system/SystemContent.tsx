import { EmptyState } from "@/components/ui/status/EmptyState";
import { MetricChart } from "@/components/overview/system/charts";
import { StorageCard } from "@/components/overview/system/storage";
import { TrafficCard } from "@/components/overview/system/TrafficCard";
import { type ISystemMetrics } from "@/services/admin/maintenance";
import { formatBytes } from "@/services/users/traffic/traffic-types";
import { useTranslation } from "react-i18next";
import { useChartStore } from "@/store/overview";

interface ISystemContent {
  data: ISystemMetrics;
  traffic: { upload: number; download: number; isAvailable: boolean };
}
export function SystemContent({ data, traffic }: ISystemContent) {
  const { t } = useTranslation();
  const current = data.samples.at(-1);
  const visible = useChartStore((state) => state.visible);
  const hasVisibleCharts = Object.values(visible).some(Boolean);
  return (
    <>
      {!data.available && <EmptyState>{t(data.error || "Системные показатели недоступны")}</EmptyState>}
      {data.available && hasVisibleCharts && (
        <div className="system-grid grid grid-cols-2 gap-4 mb-4 max-tablet:grid-cols-1">
          {visible.cpu && (
            <MetricChart
              title="CPU"
              samples={data.samples}
              field="cpu"
              value={(current?.cpu ?? 0).toFixed(1) + "%"}
              maximum={100}
              unit="percent"
            />
          )}
          {visible.memory && (
            <MetricChart
              title="Память"
              samples={data.samples}
              field="memory"
              value={formatBytes(data.memoryUsed, t) + " / " + formatBytes(data.memoryTotal, t)}
              maximum={100}
              unit="percent"
            />
          )}
          {visible.load && (
            <MetricChart
              title="Нагрузка"
              samples={data.samples}
              field="load"
              value={(current?.load ?? 0).toFixed(2) + " / " + data.cpus + " CPU"}
              maximum={data.cpus}
            />
          )}
          {visible.network && (
            <MetricChart
              title={data.scope === "host" ? "Сеть сервера" : "Сеть контейнера"}
              samples={data.samples}
              field="receive"
              secondary="transmit"
              unit="rate"
              value={"↓ " + formatBytes(Math.round(current?.receive ?? 0), t) + t("/с")}
              secondaryValue={"↑ " + formatBytes(Math.round(current?.transmit ?? 0), t) + t("/с")}
            />
          )}
        </div>
      )}
      <div className="system-grid grid grid-cols-2 gap-4 mb-4 max-tablet:grid-cols-1">
        <StorageCard value={data.storage} isHost={data.storage.managed} />
        <TrafficCard {...traffic} received={data.received} transmitted={data.transmitted} />
      </div>
    </>
  );
}
