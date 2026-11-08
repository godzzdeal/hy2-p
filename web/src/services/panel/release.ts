import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

export interface IPanelRelease {
  current: string;
  latest: string;
  url: string;
  state: "update_available" | "current" | "ahead" | "unknown";
  publishedAt: string;
  checkedAt: string;
}
export const panelReleaseApi = {
  read: () => request<IPanelRelease>(API_ROUTES.panelRelease),
};
