import { QUERY_KEYS } from "@/config/network";
import { userAccessApi } from "@/services/users/access/api";
import { type IUserAccess } from "@/services/users/access/types";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useUserAccess(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.userAccess, id],
    queryFn: () => userAccessApi.read(id),
    staleTime: 0,
  });
}
export function useSaveUserAccess(id: string) {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  const queryKey = [...QUERY_KEYS.userAccess, id];
  return useMutation({
    mutationFn: (policy: IUserAccess) => userAccessApi.save(id, policy),
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<IUserAccess>(queryKey);
      client.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
      showError(error);
    },
    onSuccess: async (saved) => {
      client.setQueryData(queryKey, saved);
      await client.invalidateQueries({ queryKey: ["connection", id] });
      await client.invalidateQueries({ queryKey: QUERY_KEYS.traffic });
      notify("Доступ к экземплярам сохранён");
    },
  });
}
