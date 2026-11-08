import { NETWORK, QUERY_KEYS } from "@/config/network";
import { firewallPortsApi } from "@/services/admin/firewall/ports";
import { useQuery } from "@tanstack/react-query";
export function useRecommendedPorts() {
  return useQuery({
    queryKey: QUERY_KEYS.firewallPorts,
    queryFn: firewallPortsApi.read,
    refetchInterval: NETWORK.staleMs,
  });
}
