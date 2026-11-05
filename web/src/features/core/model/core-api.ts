import { request, API_ROUTES } from "@/shared/http";
import type { IWatchdog } from "./watchdog-types";
export interface ICore {
  watchdog?: IWatchdog;
  running: boolean;
  available: boolean;
  binary: string;
  logs: string;
}
export type TCoreAction = "start" | "stop" | "restart";
export const coreApi = {
  read: () => request<ICore>(API_ROUTES.core),
  control: (action: TCoreAction) => request<ICore>(API_ROUTES.control(action), { method: "POST" }),
};
