import { API_ROUTES, NETWORK } from "@/config/network";
import { request } from "@/services/http/client";
import {
  type IPanelInstallation,
  type IPanelVersion,
  type IPanelOperation,
  type TPanelRequest,
} from "./types";

export const panelMaintenanceApi = {
  read: () => request<IPanelInstallation>(API_ROUTES.panelMaintenance),
  versions: () => request<IPanelVersion[]>(API_ROUTES.panelVersions),
  start: (body: TPanelRequest) =>
    request<IPanelOperation>(
      body.action === "restart" ? API_ROUTES.panelRestart : API_ROUTES.panelMaintenance,
      {
        method: "POST",
        body: body.action === "restart" ? undefined : body,
        signal: AbortSignal.timeout(NETWORK.restartRequestMs),
      },
    ),
  status: (ticket: string, signal: AbortSignal) =>
    request<IPanelOperation>(API_ROUTES.udpStatus(ticket), {
      signal: AbortSignal.any([signal, AbortSignal.timeout(NETWORK.restartRequestMs)]),
    }),
};
