import { useInstanceId, instanceKey } from "@/features/instances/model";
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
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.coreUpdate, id),
    queryFn: () => updateApi.status(id),
    refetchInterval: UPDATE_TIMING.pollMs,
    retry: false,
  });
}
export function useUpdateCommands() {
  const id = useInstanceId();
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  const onSuccess = (data: IUpdateStatus) => {
    client.setQueryData(instanceKey(QUERY_KEYS.coreUpdate, id), data);
    void client.invalidateQueries({ queryKey: instanceKey(QUERY_KEYS.core, id) });
  };
  const install = useMutation({
    mutationFn: (version: string) => updateApi.install(version, id),
    onSuccess,
    onError: showError,
  });
  const rollback = useMutation({
    mutationFn: () => updateApi.rollback(id),
    onSuccess,
    onError: showError,
  });
  return { install, rollback };
}
