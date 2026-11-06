import { instanceRoute } from "@/features/instances/model";
import { request, API_ROUTES } from "@/shared/http";
import { type IWatchdog } from "./watchdog-types";
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
