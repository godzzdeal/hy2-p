import { MUTATION_KEYS, QUERY_KEYS } from "@/config/network";
import { CONTROL_SUCCESS } from "@/hooks/core/control/control-messages";
import { coreApi, type ICoreControlInput } from "@/services/core";
import { instanceKey } from "@/services/instances/scope";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useControlMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: MUTATION_KEYS.coreControl,
    mutationFn: ({ id, action }: ICoreControlInput) => coreApi.control(action, id),
    onSuccess: (data, { id, action }) => {
      client.setQueryData(instanceKey(QUERY_KEYS.core, id), data);
      useUiStore.getState().notify(CONTROL_SUCCESS[action]);
      return Promise.all([
        client.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
        client.invalidateQueries({ queryKey: QUERY_KEYS.connection }),
      ]);
    },
  });
}
