import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/app/state";
import { QUERY_KEYS } from "@/shared/http";
import { coreApi, type ICore } from "@/features/core/model";
export function useClearLogs() {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: coreApi.clearLogs,
    onMutate: async () => {
      await client.cancelQueries({ queryKey: QUERY_KEYS.core });
      const previous = client.getQueryData<ICore>(QUERY_KEYS.core);
      if (previous) client.setQueryData(QUERY_KEYS.core, { ...previous, logs: "" });
      return { previous };
    },
    onSuccess: () => {
      notify("Журнал очищен");
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(QUERY_KEYS.core, context.previous);
      showError(error);
    },
    onSettled: () => client.invalidateQueries({ queryKey: QUERY_KEYS.core }),
  });
}
