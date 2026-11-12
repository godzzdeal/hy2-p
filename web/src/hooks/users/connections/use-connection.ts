import { QUERY_KEYS } from "@/config/network";
import { userApi } from "@/services/users/user-api";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useConnection(userId: string) {
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  const queryKey = [...QUERY_KEYS.connection, userId];
  const links = useQuery({
    queryKey,
    queryFn: () => userApi.links(userId),
    staleTime: 0,
  });
  const rotate = useMutation({
    mutationFn: () => userApi.rotate(userId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey });
      notify("Старая ссылка подписки отозвана");
    },
    onError: showError,
  });
  return { links, rotate };
}
