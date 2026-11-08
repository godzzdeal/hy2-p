import { useMutation } from "@tanstack/react-query";
import { useUiStore } from "@/app/state";
import { useUsers } from "@/features/users/model";
import { useTraffic } from "@/features/users/traffic/model";
import { useGroups } from "@/features/groups";
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
