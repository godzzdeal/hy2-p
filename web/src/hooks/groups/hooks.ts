import { NETWORK, QUERY_KEYS } from "@/config/network";
import { groupsApi } from "@/services/groups/api";
import { EMPTY_GROUPS, type IGroupAssignment, type IGroups, type IGroupSave } from "@/services/groups/types";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useGroups() {
  return useQuery({ queryKey: QUERY_KEYS.groups, queryFn: groupsApi.list, refetchInterval: NETWORK.staleMs });
}
function useGroupChange<TInput>(
  send: (input: TInput) => Promise<IGroups>,
  optimistic: (state: IGroups, input: TInput) => IGroups,
) {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: send,
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: QUERY_KEYS.groups });
      const previous = client.getQueryData<IGroups>(QUERY_KEYS.groups);
      client.setQueryData(QUERY_KEYS.groups, optimistic(previous ?? EMPTY_GROUPS, input));
      return { previous };
    },
    onError: (error, _input, context) => {
      client.setQueryData(QUERY_KEYS.groups, context?.previous ?? EMPTY_GROUPS);
      showError(error);
    },
    onSuccess: (result) => {
      client.setQueryData(QUERY_KEYS.groups, result);
      notify("Группы сохранены");
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: QUERY_KEYS.groups }),
        client.invalidateQueries({ queryKey: QUERY_KEYS.traffic }),
        client.invalidateQueries({ queryKey: QUERY_KEYS.devices }),
        client.invalidateQueries({ queryKey: ["connection"] }),
      ]);
    },
  });
}
export function useSaveGroup() {
  return useGroupChange(groupsApi.save, (state, input: IGroupSave) => ({
    ...state,
    groups: [
      ...state.groups.filter((group) => group.id !== input.id),
      { ...input.body, id: input.id ?? "pending" },
    ],
  }));
}
export function useDeleteGroup() {
  return useGroupChange(groupsApi.remove, (state, id: string) => ({
    groups: state.groups.filter((group) => group.id !== id),
    memberships: Object.fromEntries(
      Object.entries(state.memberships).filter(([_user, group]) => group !== id),
    ),
  }));
}
export function useAssignGroup() {
  return useGroupChange(groupsApi.assign, (state, input: IGroupAssignment) => {
    const memberships = { ...state.memberships };
    if (input.groupId) memberships[input.userId] = input.groupId;
    else delete memberships[input.userId];
    return { ...state, memberships };
  });
}
