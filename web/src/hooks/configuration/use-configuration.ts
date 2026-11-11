import { QUERY_KEYS } from "@/config/network";
import { configurationApi } from "@/services/configuration/configuration-api";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useConfiguration() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.settings, id),
    queryFn: () => configurationApi.read(id),
  });
}
export function useSaveConfiguration() {
  const id = useInstanceId();
  const client = useQueryClient();
  const { showError, notify } = useUiStore();
  return useMutation({
    mutationFn: (body: IConfiguration) => configurationApi.save(body, id),
    onMutate: async (next) => {
      await client.cancelQueries({
        queryKey: instanceKey(QUERY_KEYS.settings, id),
      });
      const previous = client.getQueryData<IConfiguration>(instanceKey(QUERY_KEYS.settings, id));
      client.setQueryData(instanceKey(QUERY_KEYS.settings, id), next);
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(instanceKey(QUERY_KEYS.settings, id), context.previous);
      showError(error);
    },
    onSuccess: (saved) => {
      client.setQueryData(instanceKey(QUERY_KEYS.settings, id), saved);
      notify("Конфигурация сохранена.");
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
        client.invalidateQueries({ queryKey: ["connection"] }),
        client.invalidateQueries({
          queryKey: instanceKey(QUERY_KEYS.history, id),
        }),
        client.invalidateQueries({
          queryKey: instanceKey(QUERY_KEYS.hy2Certificates, id),
        }),
        client.invalidateQueries({ queryKey: instanceKey(QUERY_KEYS.ech, id) }),
        client.invalidateQueries({
          queryKey: instanceKey(QUERY_KEYS.deployment, id),
        }),
      ]),
  });
}
