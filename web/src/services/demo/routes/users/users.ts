import { API_ROUTES } from "@/config/network";
import { DEMO } from "@/services/demo/data";
import { demoId, demoInput, demoState } from "@/services/demo/state";
import { ApiError } from "@/services/http/ApiError";
import { type IRequest } from "@/services/http/client";
import { type IUser, type IUserInput, type IUserUpdate } from "@/services/users/user-types";
import { withDefaultFlag } from "@/utils/flags/flag-options";
import { demoDevices } from "@/services/demo/routes/users/devices";
import { demoLinks } from "@/services/demo/routes/users/links";
import { EMPTY_USAGE, type IUserUsage } from "@/services/users/traffic/traffic-types";
import { type IUserAccess } from "@/services/users/access/types";
export function demoUsers(path: string, options: IRequest): unknown {
  const { method = "GET", body } = options;
  if (path === API_ROUTES.users) {
    if (method === "GET") return demoState.users.map(displayUser);
    const input = demoInput<IUserInput>(body);
    if (!input.name.trim()) throw new ApiError("Укажите имя", 400);
    if (demoState.users.length >= DEMO.userLimit)
      throw new ApiError("В демоверсии можно создать до 100 пользователей", 400);
    const user = {
      id: demoId(),
      name: input.name,
      enabled: true,
      created: new Date().toISOString(),
      expires: input.expires,
    };
    demoState.users.push(user);
    return displayUser(user);
  }
  if (!path.startsWith(API_ROUTES.users + "/")) return undefined;
  const userId = path.split("/")[2];
  const user = demoState.users.find((item) => item.id === userId);
  if (!user) throw new ApiError("Пользователь не найден", 404);
  if (path === API_ROUTES.user(userId)) {
    if (method === "DELETE") {
      demoState.users = demoState.users.filter((item) => item.id !== userId);
      delete demoState.groups.memberships[userId];
      delete demoState.traffic.users[userId];
      delete demoState.devices[userId];
      delete demoState.access[userId];
      return { ok: true };
    }
    const input = demoInput<IUserUpdate>(body);
    Object.assign(user, {
      name: input.name,
      enabled: input.enabled,
      expires: input.expires,
    });
    return displayUser(user);
  }
  if (path === API_ROUTES.userGroup(userId)) {
    const input = demoInput<{ groupId: string }>(body);
    if (input.groupId) demoState.groups.memberships[userId] = input.groupId;
    else delete demoState.groups.memberships[userId];
    return demoState.groups;
  }
  if (path === API_ROUTES.userTraffic(userId)) {
    const input = demoInput<Partial<IUserUsage> & { reset?: boolean }>(body);
    const usage = demoState.traffic.users[userId] ?? { ...EMPTY_USAGE };
    Object.assign(usage, input, input.reset ? { upload: 0, download: 0 } : {});
    demoState.traffic.users[userId] = usage;
    return usage;
  }
  if (path === API_ROUTES.userCores(userId)) {
    if (method === "PUT") demoState.access[userId] = demoInput<IUserAccess>(body);
    return demoState.access[userId] ?? { mode: "all", instances: [] };
  }
  if (path === API_ROUTES.rotate(userId)) return { ok: true };
  if (path === API_ROUTES.links(userId)) return demoLinks(user);
  return demoDevices(userId, path, options);
}
function displayUser(user: IUser): IUser {
  return {
    ...user,
    displayName: withDefaultFlag(user.name, demoState.announcement.defaultUserFlag ?? ""),
  };
}
