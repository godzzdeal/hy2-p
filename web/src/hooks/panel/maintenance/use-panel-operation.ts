import { panelMaintenanceApi, type TPanelRequest } from "@/services/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation } from "@tanstack/react-query";

export function usePanelOperation() {
  return useMutation({
    mutationFn: async (input: TPanelRequest) => {
      useUiStore.getState().setPanelRestarting(true);
      try {
        const result = await panelMaintenanceApi.start(input);
        usePanelOperationStore.getState().setActive({
          ticket: result.id,
          action: input.action,
          targetURL: input.action === "restart" ? input.targetURL : undefined,
        });
      } finally {
        useUiStore.getState().setPanelRestarting(false);
      }
    },
    onError: useUiStore.getState().showError,
  });
}
