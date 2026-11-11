import { IS_DEMO } from "@/config/build";
import { request as remote } from "@/services/http/remote";
export async function request<T>(path: string, options: IRequest = {}): Promise<T> {
  if (IS_DEMO) return (await import("@/services/demo/request")).request<T>(path, options);
  return remote<T>(path, options);
}
export interface IRequest {
  signal?: AbortSignal;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}
