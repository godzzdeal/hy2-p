import { instanceRoute } from "@/features/instances/model";
import { request, API_ROUTES } from "@/shared/http";
import { type IReleaseVersion, type IUpdateStatus } from "./update-types";
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
