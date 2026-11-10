import { NETWORK, QUERY_KEYS, MUTATION_KEYS } from "@/config/network";
import { coreApi, type TCoreAction } from "@/services/core/core-api";
import { useControlMutation } from "@/hooks/core/control";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useIsMutating, useQuery } from "@tanstack/react-query";
export function useCore() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.core, id),
    queryFn: () => coreApi.read(id),
    refetchInterval: NETWORK.corePollMs,
  });
}
export function useCoreControl() {
  const id = useInstanceId();
  const control = useControlMutation();
  const pending = useIsMutating({ mutationKey: MUTATION_KEYS.coreControl });
  return {
    isPending: pending > 0,
    mutate: (action: TCoreAction, options?: Parameters<typeof control.mutate>[1]) =>
      control.mutate({ id, action }, options),
  };
}
