import { QUERY_KEYS } from "@/config/network";
import { ApiError } from "@/services/http/ApiError";
import { type IInstance } from "@/services/instances/types";
import { useUiStore } from "@/store/ui-store";
import { i18n } from "@/config/i18n/setup";
import { type Query } from "@tanstack/react-query";
import { type IUpdateStatus } from "@/services/core/updates/update-types";
import { usePortOperationStore } from "@/store/core/port-operation-store";
const crashes = new Map<string, string>();
const updates = new Map<string, string>();
const queryErrors = new Map<string, string>();
export function notifyQueryError(error: Error, query: Query<unknown, unknown, unknown>) {
  if (error instanceof ApiError && error.status === 401) return;
  // The deployment monitor survives the expected container restart itself.
  if (query.queryKey[0] === QUERY_KEYS.udpOperation[0]) return;
  if (
    usePortOperationStore.getState().ticket &&
    (!(error instanceof ApiError) || error.status === 0 || error.status >= 500)
  )
    return;
  if (queryErrors.get(query.queryHash) === error.message) return;
  queryErrors.set(query.queryHash, error.message);
  useUiStore.getState().showError(error);
}
export function notifyQuerySuccess(data: unknown, query: Query<unknown, unknown, unknown>) {
  queryErrors.delete(query.queryHash);
  if (query.queryKey[0] === QUERY_KEYS.coreUpdate[0] && data && typeof data === "object") {
    const status = data as IUpdateStatus; // This key is populated only by updateApi.status.
    const key = JSON.stringify(query.queryKey);
    const stamp = status.result.started + status.result.phase;
    if (
      status.result.started &&
      !status.busy &&
      updates.get(key) !== stamp &&
      ["failed", "rolled_back", "success"].includes(status.result.phase)
    ) {
      updates.set(key, stamp);
      if (status.result.phase === "success") useUiStore.getState().notify(status.result.message);
      else useUiStore.getState().showError(status.result.message);
    }
  }
  if (query.queryKey[0] !== QUERY_KEYS.instances[0] || !Array.isArray(data)) return;
  const instances = data as IInstance[]; // This key is populated only by instancesApi.list.
  for (const instance of instances) {
    if (instance.error && crashes.get("config:" + instance.id) !== instance.error) {
      crashes.set("config:" + instance.id, instance.error);
      useUiStore.getState().showError(instance.name + ": " + i18n.t(instance.error));
    }
    if (!instance.error) crashes.delete("config:" + instance.id);
    const watchdog = instance.watchdog;
    if (instance.updating || !watchdog?.desiredRunning) continue;
    const stamp = watchdog.lastCrash + watchdog.lastError;
    if ((!watchdog.lastCrash && !watchdog.lastError) || crashes.get(instance.id) === stamp) continue;
    crashes.set(instance.id, stamp);
    const details = watchdog.lastError || watchdog.message;
    useUiStore.getState().showError(i18n.t("Ошибка ядра") + ": " + instance.name + ". " + i18n.t(details));
  }
}
