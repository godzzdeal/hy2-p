import { useInstanceId, instanceKey } from "@/features/instances/model";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NETWORK, QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { coreApi } from "./core-api";
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
