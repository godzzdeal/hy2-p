import { request, API_ROUTES } from "@/shared/http";
import { type IReleaseVersion, type IUpdateStatus } from "./update-types";
export const updateApi = {
  versions: () => request<IReleaseVersion[]>(API_ROUTES.coreVersions),
  status: () => request<IUpdateStatus>(API_ROUTES.coreUpdate),
  install: (version: string) =>
    request<IUpdateStatus>(API_ROUTES.coreUpdate, {
      method: "POST",
      body: { version },
    }),
  rollback: () => request<IUpdateStatus>(API_ROUTES.coreRollback, { method: "POST" }),
};
