import { waitForPanelRestart } from "@/hooks/admin/maintenance/poll-restart";
import { endSession } from "@/hooks/session/end-session";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function usePanelRestart() {
  const controller = useRef<AbortController | null>(null);
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  useEffect(() => () => controller.current?.abort(), []);
  return useMutation({
    mutationFn: () => {
      controller.current?.abort();
      controller.current = new AbortController();
      useUiStore.getState().setPanelRestarting(true);
      return waitForPanelRestart(controller.current.signal).finally(() =>
        useUiStore.getState().setPanelRestarting(false),
      );
    },
    onSuccess: () => {
      notify("Панель перезапущена. Войдите снова.");
      endSession(client);
    },
  });
}
