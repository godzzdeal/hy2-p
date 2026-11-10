import { NETWORK, QUERY_KEYS } from "@/config/network";
import { maintenanceApi } from "@/services/admin/maintenance";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { useQuery } from "@tanstack/react-query";

export function useSystemMetrics() {
  const traffic = useTraffic();
  const read = useQuery({
    queryKey: QUERY_KEYS.system,
    queryFn: maintenanceApi.metrics,
    refetchInterval: NETWORK.systemPollMs,
    retry: false,
  });
  let upload = 0;
  let download = 0;
  for (const usage of Object.values(traffic.data?.users ?? {})) {
    upload += usage.upload;
    download += usage.download;
  }
  return { read, traffic: { upload, download, isAvailable: traffic.data?.available ?? false } };
}
