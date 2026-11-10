import { QUERY_KEYS } from "@/config/network";
import { panelMaintenanceApi, type TPanelRequest, type IPanelOperation } from "@/services/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import { isNewerVersion } from "@/utils/core/version";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function usePanelMaintenance() {
  const client = useQueryClient();
  const active = usePanelOperationStore((state) => state.active);
  const installation = useQuery({ queryKey: QUERY_KEYS.panelMaintenance, queryFn: panelMaintenanceApi.read });
  const versions = useQuery({
    queryKey: QUERY_KEYS.panelVersions,
    queryFn: panelMaintenanceApi.versions,
    enabled: installation.data?.available === true,
  });
  const [selection, setSelection] = useState("");
  const [confirmation, setConfirmation] = useState<TPanelRequest | null>(null);
  const version = selection || versions.data?.[0]?.version || "";
  const isBusy = !!active || installation.data?.operation?.busy === true;
  const operation = installation.data?.operation;
  useEffect(() => {
    if (
      !active &&
      operation?.busy &&
      client.getQueryData<IPanelOperation>([...QUERY_KEYS.panelOperation, operation.id])?.busy !== false &&
      (operation.operation === "update" ||
        operation.operation === "rollback" ||
        operation.operation === "cleanup")
    )
      usePanelOperationStore.getState().setActive({ ticket: operation.id, action: operation.operation });
  }, [active, operation, client]);
  return {
    installation,
    versions,
    version,
    setSelection,
    confirmation,
    setConfirmation,
    isBusy,
    canUpdate:
      installation.data?.available === true && isNewerVersion(installation.data.current, version) && !isBusy,
    canRollback: installation.data?.rollbackAvailable === true && !isBusy,
  };
}
