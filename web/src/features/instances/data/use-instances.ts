import { useEffect } from "react";
import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { NETWORK, QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { i18n } from "@/shared/i18n/setup";
import { useInstanceStore, useInstanceId, DEFAULT_INSTANCE } from "../model";
import { instancesApi } from "./api";
export function useInstances() {
  return useQuery({
    queryKey: QUERY_KEYS.instances,
    queryFn: instancesApi.list,
    refetchInterval: NETWORK.corePollMs,
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
