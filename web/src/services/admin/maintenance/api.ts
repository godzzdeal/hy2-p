import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { type IPortOperation } from "@/services/configuration/deployment/operation/api";
import { type ISystemMetrics } from "@/services/admin/maintenance/types";

export const maintenanceApi = {
  metrics: () => request<ISystemMetrics>(API_ROUTES.system),
  restart: (signal: AbortSignal) =>
    request<IPortOperation>(API_ROUTES.panelRestart, { method: "POST", signal }),
  restartStatus: (ticket: string, signal: AbortSignal) =>
    request<IPortOperation>(API_ROUTES.panelRestartStatus(ticket), { signal }),
};
