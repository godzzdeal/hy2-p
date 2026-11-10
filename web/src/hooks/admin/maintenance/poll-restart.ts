import { NETWORK } from "@/config/network";
import { maintenanceApi } from "@/services/admin/maintenance";
import { ApiError } from "@/services/http/ApiError";
import { type IPortOperation } from "@/services/configuration/deployment/operation/api";

export async function waitForPanelRestart(signal: AbortSignal): Promise<void> {
  const operation = await maintenanceApi.restart(
    AbortSignal.any([signal, AbortSignal.timeout(NETWORK.restartRequestMs)]),
  );
  const deadline = Date.now() + NETWORK.restartTimeoutMs;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    let status: IPortOperation | undefined;
    try {
      status = await maintenanceApi.restartStatus(
        operation.id,
        AbortSignal.any([signal, AbortSignal.timeout(NETWORK.restartRequestMs)]),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status > 0 && error.status < 500) throw error;
      // The panel is unreachable while its container restarts.
    }
    if (status?.phase === "success") return;
    if (status?.phase === "failed") throw new Error(status.message);
    await new Promise<void>((resolve) => setTimeout(resolve, NETWORK.restartPollMs));
  }
  throw new Error("Панель пока не отвечает после перезапуска. Проверьте сервер");
}
