import { NETWORK, QUERY_KEYS } from "@/config/network";
import { portOperationApi } from "@/services/configuration/deployment/operation/api";
import { ApiError } from "@/services/http/ApiError";
import { useInstanceId } from "@/store/core/instance-store";
import { usePortOperationStore } from "@/store/core/port-operation-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
export function useApplyPort() {
  const id = useInstanceId();
  const setTicket = usePortOperationStore((state) => state.setTicket);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: (ports: Parameters<typeof portOperationApi.apply>[0]) => portOperationApi.apply(ports, id),
    onSuccess: (result) => setTicket(result.id),
    onError: showError,
  });
}
export function usePortProgress() {
  const ticket = usePortOperationStore((state) => state.ticket);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.udpOperation, ticket],
    queryFn: () => portOperationApi.status(ticket),
    enabled: !!ticket,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.busy === false ||
      (query.state.error instanceof ApiError && query.state.error.status === 404)
        ? false
        : NETWORK.udpApplyPollMs,
  });
  const phase = query.data?.phase;
  useEffect(() => {
    if (!phase || phase === "applying" || phase === "idle") return;
    void client.invalidateQueries({ queryKey: QUERY_KEYS.instances });
    void client.invalidateQueries({ queryKey: QUERY_KEYS.deployment });
    void client.invalidateQueries({ queryKey: QUERY_KEYS.core });
  }, [phase, client]);
  return {
    ...query,
    ticket,
    isMissing: query.error instanceof ApiError && query.error.status === 404,
  };
}
