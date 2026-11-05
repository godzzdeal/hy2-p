import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { configurationApi } from "./configuration-api";
import { type IConfiguration } from "./configuration-types";
export function useConfiguration() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: configurationApi.read,
  });
}
export function useSaveConfiguration() {
  const client = useQueryClient();
  const { showError, notify } = useUiStore();
  return useMutation({
    mutationFn: configurationApi.save,
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: QUERY_KEYS.settings });
      const previous = client.getQueryData<IConfiguration>(QUERY_KEYS.settings);
      client.setQueryData(QUERY_KEYS.settings, next);
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(QUERY_KEYS.settings, context.previous);
      showError(error);
    },
    onSuccess: (saved) => {
      client.setQueryData(QUERY_KEYS.settings, saved);
      notify("Сохранено. Перезапустите ядро для применения.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: QUERY_KEYS.history }),
  });
}
