import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";

export interface IMimicCheck {
  id: string;
  ok: boolean;
  detail: string;
}
export interface IMimicStatus {
  ready: boolean;
  container: boolean;
  managed: boolean;
  instanceId: string;
  kernel: string;
  interfaces: string[];
  checks: IMimicCheck[];
}

export const mimicApi = {
  read: (id: string) => request<IMimicStatus>(instanceRoute(API_ROUTES.mimic, id)),
  check: ({ source, id }: { source: string; id: string }) =>
    request<IMimicStatus>(instanceRoute(API_ROUTES.mimic, id), { method: "POST", body: { config: source } }),
};
