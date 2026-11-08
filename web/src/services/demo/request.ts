import { API_ROUTES } from "@/config/network";
import { demoAdmin, demoGroups } from "@/services/demo/routes";
import { demoCore, demoInstances, demoSettings } from "@/services/demo/routes/server";
import { demoUsers } from "@/services/demo/routes/users";
import { demoInput, demoState, unavailable } from "@/services/demo/state";
import { ApiError } from "@/services/http/ApiError";
import { type IRequest } from "@/services/http/client";
import { DEFAULT_INSTANCE } from "@/services/instances/types";
function resolveDemo(path: string, options: IRequest): unknown {
  if (path === API_ROUTES.login) {
    const input = demoInput<{ username: string; password: string }>(options.body);
    if (input.username !== "demo" || input.password !== "demo")
      throw new ApiError("Для входа в демоверсию используйте demo / demo", 401);
    demoState.isAuthorized = true;
    return { ok: true };
  }
  if (!demoState.isAuthorized) throw new ApiError("Нужен вход", 401);
  if (path === API_ROUTES.session) return { ok: true, username: "demo" };
  if (path === API_ROUTES.logout) {
    demoState.isAuthorized = false;
    return { ok: true };
  }
  if (path === API_ROUTES.traffic) return demoState.traffic;
  let instanceId = DEFAULT_INSTANCE;
  let scopedPath = path;
  const scoped = path.startsWith(API_ROUTES.instances + "/") && path.split("/").length > 3;
  if (scoped) {
    instanceId = path.split("/")[2];
    scopedPath = "/" + path.split("/").slice(3).join("/");
  } else {
    const instances = demoInstances(path, options);
    if (instances !== undefined) return instances;
    const users = demoUsers(path, options);
    if (users !== undefined) return users;
    const groups = demoGroups(path, options);
    if (groups !== undefined) return groups;
  }
  const settings = demoSettings(scopedPath, instanceId, options);
  if (settings !== undefined) return settings;
  if (scopedPath === API_ROUTES.coreUpdate && options.method === "POST") return unavailable();
  const core = demoCore(scopedPath, instanceId);
  if (core !== undefined) return core;
  if (scoped) throw new ApiError("Ядро не найдено", 404);
  const admin = demoAdmin(path, options);
  if (admin !== undefined) return admin;
  throw new ApiError("Раздел недоступен в демоверсии", 404);
}
export async function request<T>(path: string, options: IRequest = {}): Promise<T> {
  const body: unknown = options.body === undefined ? undefined : JSON.parse(JSON.stringify(options.body));
  return structuredClone(resolveDemo(path, { ...options, body })) as T; // Matches the contracts of the shared API wrappers.
}
