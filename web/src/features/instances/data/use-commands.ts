import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/app/state";
import { QUERY_KEYS } from "@/shared/http";
import { coreApi, type TCoreAction } from "@/features/core/model";
import { usePortOperationStore } from "@/features/configuration/model/deployment/operation";
import { instancesApi } from "./api";
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
  const control = useMutation({
    mutationFn: (input: { id: string; action: TCoreAction }) => coreApi.control(input.action, input.id),
    onSuccess: refresh,
    onError: showError,
  });
  return { create, rename, remove, control };
}
