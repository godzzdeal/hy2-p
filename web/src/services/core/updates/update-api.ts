import { API_ROUTES } from "@/config/network";
import { type IReleaseVersion, type IUpdateStatus } from "@/services/core/updates/update-types";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export const updateApi = {
  versions: () => request<IReleaseVersion[]>(API_ROUTES.coreVersions),
  status: (id?: string) => request<IUpdateStatus>(instanceRoute(API_ROUTES.coreUpdate, id)),
  install: (version: string, id?: string) =>
    request<IUpdateStatus>(instanceRoute(API_ROUTES.coreUpdate, id), {
      method: "POST",
      body: { version },
    }),
  rollback: (id?: string) =>
    request<IUpdateStatus>(instanceRoute(API_ROUTES.coreRollback, id), { method: "POST" }),
};
