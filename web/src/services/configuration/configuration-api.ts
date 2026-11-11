import { API_ROUTES } from "@/config/network";
import { type IConfiguration, type IRevision } from "@/services/configuration/configuration-types";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";
export const configurationApi = {
  read: (id?: string) => request<IConfiguration>(instanceRoute(API_ROUTES.settings, id)),
  save: (body: IConfiguration, id?: string) =>
    request<IConfiguration>(instanceRoute(API_ROUTES.settings, id), {
      method: "PUT",
      body,
    }),
  history: (id?: string) => request<IRevision[]>(instanceRoute(API_ROUTES.history, id)),
};
