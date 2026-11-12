import { NETWORK, QUERY_KEYS } from "@/config/network";
import { endSession } from "@/hooks/session/end-session";
import { panelMaintenanceApi } from "@/services/panel/maintenance";
import { ApiError } from "@/services/http/ApiError";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { useUiStore } from "@/store/ui-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function usePanelProgress() {
  const active = usePanelOperationStore((state) => state.active);
  const setActive = usePanelOperationStore((state) => state.setActive);
  const client = useQueryClient();
  const handled = useRef("");
  const query = useQuery({
    queryKey: [...QUERY_KEYS.panelOperation, active?.ticket],
    queryFn: ({ signal }) => panelMaintenanceApi.status(active!.ticket, signal),
    enabled: !!active,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.busy === false ? false : NETWORK.restartPollMs),
  });
  const result = query.data;
  useEffect(() => {
    if (!active) return;
    if (query.error instanceof ApiError && query.error.status === 404) {
      useUiStore.getState().showError("Задача обслуживания больше не найдена. Проверьте состояние панели");
      setActive(null);
      void client.invalidateQueries({ queryKey: QUERY_KEYS.session });
      return;
    }
    if (!result || result.busy || handled.current === active.ticket) return;
    handled.current = active.ticket;
    if (result.phase === "success")
      useUiStore
        .getState()
        .notify(active.action === "restart" ? "Панель перезапущена. Войдите снова." : result.message);
    else useUiStore.getState().showError(result.message);
    if (result.phase === "success" || result.phase === "rolled_back") {
      if (active.action === "cleanup" || active.action === "backup" || active.action === "backup-cloud") {
        setActive(null);
        void client.invalidateQueries({ queryKey: QUERY_KEYS.system });
        void client.invalidateQueries({
          queryKey: QUERY_KEYS.panelMaintenance,
        });
        return;
      }
      if (active.action === "restart") setActive(null);
      endSession(client);
    } else {
      setActive(null);
      void client.invalidateQueries({ queryKey: QUERY_KEYS.panelMaintenance });
      void client.invalidateQueries({ queryKey: QUERY_KEYS.session });
    }
  }, [active, result, query.error, setActive, client]);
  function onReload() {
    setActive(null);
    window.location.reload();
  }
  return { active, query, onReload };
}
