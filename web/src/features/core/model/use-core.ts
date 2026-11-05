import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NETWORK, QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { coreApi } from "./core-api";
export function useCore() {
  return useQuery({
    queryKey: QUERY_KEYS.core,
    queryFn: coreApi.read,
    refetchInterval: NETWORK.corePollMs,
  });
}
export function useCoreControl() {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: coreApi.control,
    onSuccess: (data) => {
      client.setQueryData(QUERY_KEYS.core, data);
      notify("Команда выполнена. Проверьте журнал ядра.");
    },
    onError: showError,
  });
}
