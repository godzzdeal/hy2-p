import { QUERY_KEYS } from "@/config/network";
import { useControlMutation } from "@/hooks/core/control";
import { instancesApi } from "@/services/instances/api";
import { usePortOperationStore } from "@/store/core/port-operation-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export function useInstanceCommands() {
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  const setTicket = usePortOperationStore((state) => state.setTicket);
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
      client.invalidateQueries({ queryKey: QUERY_KEYS.core }),
      client.invalidateQueries({ queryKey: ["connection"] }),
    ]);
  const create = useMutation({ mutationFn: instancesApi.create, onSuccess: refresh, onError: showError });
  const rename = useMutation({
    mutationFn: (input: { id: string; name: string }) => instancesApi.rename(input.id, input.name),
    onSuccess: refresh,
    onError: showError,
  });
  const remove = useMutation({
    mutationFn: instancesApi.remove,
    onSuccess: async (result) => {
      if (result.operation?.id) setTicket(result.operation.id);
      await refresh();
    },
    onError: showError,
  });
  const control = useControlMutation();
  return { create, rename, remove, control };
}
