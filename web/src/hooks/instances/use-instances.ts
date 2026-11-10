import { i18n } from "@/config/i18n/setup";
import { NETWORK, QUERY_KEYS } from "@/config/network";
import { instancesApi } from "@/services/instances/api";
import { DEFAULT_INSTANCE } from "@/services/instances/types";
import { useInstanceId, useInstanceStore } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
export function useInstances(isEnabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.instances,
    queryFn: instancesApi.list,
    enabled: isEnabled,
    refetchInterval: isEnabled ? NETWORK.corePollMs : false,
  });
}
export function useInstanceSelection() {
  const client = useQueryClient();
  const pending = useIsMutating();
  const id = useInstanceId();
  const setId = useInstanceStore((state) => state.setId);
  function select(next: string): boolean {
    if (client.isMutating()) return false;
    const ui = useUiStore.getState();
    if (
      id !== next &&
      ui.hasUnsavedConfiguration &&
      !window.confirm(i18n.t("Есть несохранённые изменения. Уйти без сохранения?"))
    )
      return false;
    setId(next);
    return true;
  }
  return { id, select, isPending: pending > 0 };
}
export function useInstanceRecovery() {
  const query = useInstances();
  const id = useInstanceId();
  const setId = useInstanceStore((state) => state.setId);
  useEffect(() => {
    if (query.data && !query.data.some((item) => item.id === id && !item.removing)) setId(DEFAULT_INSTANCE);
  }, [query.data, id, setId]);
}
