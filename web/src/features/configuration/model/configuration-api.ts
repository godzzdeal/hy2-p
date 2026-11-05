import { request, API_ROUTES } from "@/shared/http";
import type { IConfiguration, IRevision } from "./configuration-types";
export const configurationApi = {
  read: () => request<IConfiguration>(API_ROUTES.settings),
  save: (body: IConfiguration) => request<IConfiguration>(API_ROUTES.settings, { method: "PUT", body }),
  history: () => request<IRevision[]>(API_ROUTES.history),
};
