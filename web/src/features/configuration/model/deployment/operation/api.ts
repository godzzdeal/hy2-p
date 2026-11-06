import { request, API_ROUTES } from "@/shared/http";
export interface IPortOperation {
  id: string;
  phase: "idle" | "applying" | "success" | "rolled_back" | "failed";
  busy: boolean;
  message: string;
  publicPort: string;
  listenPort: string;
  udpChecked: boolean;
  coreChecked: boolean;
}
export const portOperationApi = {
  apply: (ports: { publicPort: string; listenPort: string }) =>
    request<IPortOperation>(API_ROUTES.udpApply, { method: "POST", body: ports }),
  status: (ticket: string) => request<IPortOperation>(API_ROUTES.udpStatus(ticket)),
};
