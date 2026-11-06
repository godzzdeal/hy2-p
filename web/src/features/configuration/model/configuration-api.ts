import { instanceRoute } from "@/features/instances/model";
import { request, API_ROUTES } from "@/shared/http";
import { type IConfiguration, type IRevision } from "./configuration-types";
export const configurationApi = {
  read: (id?: string) => request<IConfiguration>(instanceRoute(API_ROUTES.settings, id)),
  save: (body: IConfiguration, id?: string) =>
    request<IConfiguration>(instanceRoute(API_ROUTES.settings, id), { method: "PUT", body }),
  history: (id?: string) => request<IRevision[]>(instanceRoute(API_ROUTES.history, id)),
};
