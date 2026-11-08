import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

export interface IBuildVersion {
  version: string;
  revision: string;
}
export const versionApi = {
  read: () => request<IBuildVersion>(API_ROUTES.panelVersion),
};
