import { request, API_ROUTES } from "@/shared/http";
import { type IConfiguration } from "@/features/configuration/model";
import { type IPortOperation } from "@/features/configuration/model/deployment/operation/api";
import { type IInstance } from "../model";
export const instancesApi = {
  list: () => request<IInstance[]>(API_ROUTES.instances),
  create: (body: { name: string; settings: IConfiguration }) =>
    request<{ id: string }>(API_ROUTES.instances, { method: "POST", body }),
  rename: (id: string, name: string) =>
    request<{ ok: boolean }>(API_ROUTES.instance(id), { method: "PATCH", body: { name } }),
  remove: (id: string) =>
    request<{ removed: boolean; operation: IPortOperation | null }>(API_ROUTES.instance(id), {
      method: "DELETE",
    }),
};
