import { QUERY_KEYS } from "@/config/network";
import { trafficApi } from "@/services/users/traffic/traffic-api";
import { TRAFFIC_POLL_MS } from "@/services/users/traffic/traffic-types";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useTraffic(isPolling = false) {
  return useQuery({
    queryKey: QUERY_KEYS.traffic,
    queryFn: trafficApi.read,
    refetchInterval: isPolling ? TRAFFIC_POLL_MS : false,
  });
}
export function useAdjustTraffic() {
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: trafficApi.adjust,
    onError: showError,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: QUERY_KEYS.traffic });
      notify("Лимит и счётчики трафика сохранены");
    },
  });
}
