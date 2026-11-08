import { useGroups } from "@/hooks/groups/hooks";
import { useTraffic } from "@/hooks/users/traffic/use-traffic";
import { useUsers } from "@/hooks/users/user-queries";
import { useUiStore } from "@/store/ui-store";
import { useMutation } from "@tanstack/react-query";
export function useUsersRefresh() {
  const users = useUsers();
  const traffic = useTraffic();
  const groups = useGroups();
  const { showError, notify } = useUiStore();
  return useMutation({
    mutationFn: () =>
      Promise.all([
        users.refetch({ throwOnError: true }),
        traffic.refetch({ throwOnError: true }),
        groups.refetch({ throwOnError: true }),
      ]),
    onError: showError,
    onSuccess: () => notify("Список пользователей обновлён"),
  });
}
