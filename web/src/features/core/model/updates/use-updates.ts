import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/app/state";
import { QUERY_KEYS } from "@/shared/http";
import { updateApi } from "./update-api";
import { UPDATE_TIMING } from "./update-types";
import { type IUpdateStatus } from "./update-types";
export function useReleaseVersions() {
  return useQuery({
    queryKey: QUERY_KEYS.coreVersions,
    queryFn: updateApi.versions,
    staleTime: UPDATE_TIMING.releaseStaleMs,
    retry: false,
  });
}
export function useUpdateStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.coreUpdate,
    queryFn: updateApi.status,
    refetchInterval: UPDATE_TIMING.pollMs,
    retry: false,
  });
}
export function useUpdateCommands() {
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  const onSuccess = (data: IUpdateStatus) => {
    client.setQueryData(QUERY_KEYS.coreUpdate, data);
    void client.invalidateQueries({ queryKey: QUERY_KEYS.core });
  };
  const install = useMutation({
    mutationFn: updateApi.install,
    onSuccess,
    onError: showError,
  });
  const rollback = useMutation({
    mutationFn: updateApi.rollback,
    onSuccess,
    onError: showError,
  });
  return { install, rollback };
}
