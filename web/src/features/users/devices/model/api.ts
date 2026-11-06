import { request, API_ROUTES } from "@/shared/http";
import { type IDevices } from "./types";
export const devicesApi = {
  remove: (id: string, device: string) =>
    request<IDevices>(API_ROUTES.userDevice(id, device), { method: "DELETE" }),
  read: (id: string) => request<IDevices>(API_ROUTES.userDevices(id)),
  limit: (id: string, limit: number) =>
    request<IDevices>(API_ROUTES.userDevices(id), { method: "PUT", body: { limit } }),
  edit: (id: string, device: string, blocked: boolean) =>
    request<IDevices>(API_ROUTES.userDevice(id, device), { method: "PATCH", body: { blocked } }),
};
