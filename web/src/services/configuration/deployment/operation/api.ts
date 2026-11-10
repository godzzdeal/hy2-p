import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export interface IPortOperation {
  id: string;
  instanceId?: string;
  remove?: boolean;
  phase: "idle" | "applying" | "restarting" | "success" | "rolled_back" | "failed";
  busy: boolean;
  message: string;
  publicPort: string;
  listenPort: string;
  udpChecked: boolean;
  coreChecked: boolean;
}
export const portOperationApi = {
  apply: (ports: { publicPort: string; listenPort: string }, id?: string) =>
    request<IPortOperation>(instanceRoute(API_ROUTES.udpApply, id), { method: "POST", body: ports }),
  status: (ticket: string) => request<IPortOperation>(API_ROUTES.udpStatus(ticket)),
};
