import { API_ROUTES } from "@/config/network";
import { type IWatchdog } from "@/services/core/watchdog-types";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export interface ICore {
  watchdog?: IWatchdog;
  running: boolean;
  available: boolean;
  binary: string;
  logs: string;
}
export type TCoreAction = "start" | "stop" | "restart";
export const coreApi = {
  clearLogs: (id?: string) =>
    request<{ logs: string }>(instanceRoute(API_ROUTES.logs, id), { method: "DELETE" }),
  read: (id?: string) => request<ICore>(instanceRoute(API_ROUTES.core, id)),
  control: (action: TCoreAction, id?: string) =>
    request<ICore>(instanceRoute(API_ROUTES.control(action), id), { method: "POST" }),
};
