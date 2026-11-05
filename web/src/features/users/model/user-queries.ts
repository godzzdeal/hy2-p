import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { userApi } from "./user-api";
import { type IUser } from "./user-types";
export function useUsers() {
  return useQuery({ queryKey: QUERY_KEYS.users, queryFn: userApi.list });
}
export function useUserCommands() {
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  const notify = useUiStore((state) => state.notify);
  const onSettled = () => client.invalidateQueries({ queryKey: QUERY_KEYS.users });
  const create = useMutation({
    mutationFn: userApi.create,
    onError: showError,
    onSettled,
    onSuccess: () => notify("Пользователь создан"),
  });
  const update = useMutation({
    mutationFn: userApi.update,
    onMutate: async ({ id, body }) => {
      await client.cancelQueries({ queryKey: QUERY_KEYS.users });
      const previous = client.getQueryData<IUser[]>(QUERY_KEYS.users);
      client.setQueryData<IUser[]>(QUERY_KEYS.users, (users) =>
        users?.map((user) =>
          user.id === id ? { ...user, name: body.name, enabled: body.enabled, expires: body.expires } : user,
        ),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(QUERY_KEYS.users, context.previous);
      showError(error);
    },
    onSettled,
    onSuccess: () => notify("Пользователь сохранён"),
  });
  const remove = useMutation({
    mutationFn: userApi.remove,
    onError: showError,
    onSettled,
    onSuccess: () => notify("Пользователь удалён"),
  });
  return { create, update, remove };
}
