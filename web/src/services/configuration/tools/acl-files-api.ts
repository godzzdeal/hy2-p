import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";
import { instanceRoute } from "@/services/instances/scope";

export const ACL_FILE_KINDS = ["file", "geoip", "geosite"] as const;
export type TAclFileKind = (typeof ACL_FILE_KINDS)[number];
export const ACL_FILE_LIMITS = {
  file: 1024 * 1024,
  geoip: 128 * 1024 * 1024,
  geosite: 128 * 1024 * 1024,
} as const;

export const aclFilesApi = {
  store: ({ kind, source, id }: { kind: TAclFileKind; source: File | string; id: string }) => {
    let body: FormData | { url: string };
    if (typeof source === "string") body = { url: source };
    else {
      body = new FormData();
      body.append("file", source);
    }
    return request<{ path: string }>(instanceRoute(API_ROUTES.aclFile, id) + "?kind=" + kind, {
      method: "POST",
      body,
    });
  },
};
