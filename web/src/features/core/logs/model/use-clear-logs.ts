import { useInstanceId, instanceKey } from "@/features/instances/model";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/app/state";
import { QUERY_KEYS } from "@/shared/http";
import { coreApi, type ICore } from "@/features/core/model";
export function useClearLogs() {
  const id = useInstanceId();
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: () => coreApi.clearLogs(id),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: instanceKey(QUERY_KEYS.core, id) });
      const previous = client.getQueryData<ICore>(instanceKey(QUERY_KEYS.core, id));
      if (previous) client.setQueryData(instanceKey(QUERY_KEYS.core, id), { ...previous, logs: "" });
      return { previous };
    },
    onSuccess: () => {
      notify("Журнал очищен");
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(instanceKey(QUERY_KEYS.core, id), context.previous);
      showError(error);
    },
    onSettled: () => client.invalidateQueries({ queryKey: instanceKey(QUERY_KEYS.core, id) }),
  });
}
