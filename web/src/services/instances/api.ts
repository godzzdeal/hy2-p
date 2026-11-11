import { API_ROUTES } from "@/config/network";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { type IPortOperation } from "@/services/configuration/deployment/operation/api";
import { request } from "@/services/http/client";
import { type IInstance } from "@/services/instances/types";
export const instancesApi = {
  list: () => request<IInstance[]>(API_ROUTES.instances),
  create: (body: { name: string; settings: IConfiguration }) =>
    request<{ id: string }>(API_ROUTES.instances, { method: "POST", body }),
  rename: (id: string, name: string) =>
    request<{ ok: boolean }>(API_ROUTES.instance(id), {
      method: "PATCH",
      body: { name },
    }),
  remove: (id: string) =>
    request<{ removed: boolean; operation: IPortOperation | null }>(API_ROUTES.instance(id), {
      method: "DELETE",
    }),
};
