import { NETWORK, QUERY_KEYS } from "@/config/network";
import { maintenanceApi } from "@/services/admin/maintenance";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { useQuery } from "@tanstack/react-query";
import { useChartStore } from "@/store/overview";

export function useSystemMetrics() {
  const visible = useChartStore((state) => state.visible);
  const hasVisibleCharts = Object.values(visible).some(Boolean);
  const traffic = useTraffic();
  const read = useQuery({
    queryKey: QUERY_KEYS.system,
    queryFn: maintenanceApi.metrics,
    refetchInterval: hasVisibleCharts ? NETWORK.systemPollMs : NETWORK.storagePollMs,
    retry: false,
  });
  let upload = 0;
  let download = 0;
  for (const usage of Object.values(traffic.data?.users ?? {})) {
    upload += usage.upload;
    download += usage.download;
  }
  return {
    read,
    hasVisibleCharts,
    traffic: {
      upload,
      download,
      isAvailable: traffic.data?.available ?? false,
    },
  };
}
