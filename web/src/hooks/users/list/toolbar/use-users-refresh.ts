import { QUERY_KEYS } from "@/config/network";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export function useUsersRefresh() {
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: () =>
      Promise.all([
        client.refetchQueries({ queryKey: QUERY_KEYS.users, exact: true }, { throwOnError: true }),
        client.refetchQueries({ queryKey: QUERY_KEYS.traffic, exact: true }, { throwOnError: true }),
        client.refetchQueries({ queryKey: QUERY_KEYS.groups, exact: true }, { throwOnError: true }),
      ]),
    onError: showError,
    onSuccess: () => notify("Список пользователей обновлён"),
  });
}
