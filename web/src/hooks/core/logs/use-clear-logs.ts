import { QUERY_KEYS } from "@/config/network";
import { coreApi, type ICore } from "@/services/core/core-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export function useClearLogs() {
  const id = useInstanceId();
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: () => coreApi.clearLogs(id),
    onMutate: async () => {
      await client.cancelQueries({
        queryKey: instanceKey(QUERY_KEYS.core, id),
      });
      const previous = client.getQueryData<ICore>(instanceKey(QUERY_KEYS.core, id));
      if (previous)
        client.setQueryData(instanceKey(QUERY_KEYS.core, id), {
          ...previous,
          logs: "",
        });
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
