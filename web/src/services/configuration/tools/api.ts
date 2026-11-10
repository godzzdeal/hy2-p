import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";

export interface IEch {
  publicName?: string;
  keyPath: string;
  configList: string;
}
export interface IStatsSecret {
  listen: string;
  secret: string;
  running: boolean;
}
export const coreToolsApi = {
  read: (id?: string, keyPath?: string) =>
    request<IEch>(
      instanceRoute(API_ROUTES.ech, id) + (keyPath ? "?keyPath=" + encodeURIComponent(keyPath) : ""),
    ),
  generate: (publicName: string, id?: string) =>
    request<IEch>(instanceRoute(API_ROUTES.ech, id), { method: "POST", body: { publicName } }),
  stats: (id?: string) => request<IStatsSecret>(instanceRoute(API_ROUTES.statsSecret, id)),
};
