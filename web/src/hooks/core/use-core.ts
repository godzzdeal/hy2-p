import { NETWORK, QUERY_KEYS } from "@/config/network";
import { coreApi } from "@/services/core/core-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useCore() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.core, id),
    queryFn: () => coreApi.read(id),
    refetchInterval: NETWORK.corePollMs,
  });
}
export function useCoreControl() {
  const id = useInstanceId();
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: (action: Parameters<typeof coreApi.control>[0]) => coreApi.control(action, id),
    onSuccess: (data, action) => {
      client.setQueryData(instanceKey(QUERY_KEYS.core, id), data);
      void client.invalidateQueries({ queryKey: QUERY_KEYS.instances });
      notify(action === "stop" ? "Ядро остановлено." : "Ядро запускается. Проверьте подключение в Happ.");
    },
    onError: showError,
  });
}
