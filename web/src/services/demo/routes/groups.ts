import { API_ROUTES } from "@/config/network";
import { demoId, demoInput, demoState } from "@/services/demo/state";
import { replaceGroupMembers } from "@/services/groups/membership";
import { type IGroupInput } from "@/services/groups/types";
import { ApiError } from "@/services/http/ApiError";
import { type IRequest } from "@/services/http/client";
export function demoGroups(path: string, { method = "GET", body }: IRequest): unknown {
  if (path === API_ROUTES.groups) {
    if (method === "POST") {
      const input = demoInput<IGroupInput>(body);
      if (!input.name.trim()) throw new ApiError("Укажите название группы", 400);
      demoState.groups.groups.push({ ...input, id: demoId() });
    }
    return demoState.groups;
  }
  const group = demoState.groups.groups.find(
    (item) => path === API_ROUTES.group(item.id) || path === API_ROUTES.groupMembers(item.id),
  );
  if (!group) return undefined;
  if (path === API_ROUTES.groupMembers(group.id) && method === "PUT") {
    const input = demoInput<{ userIds: string[] }>(body);
    demoState.groups = replaceGroupMembers(demoState.groups, {
      groupId: group.id,
      userIds: input.userIds,
    });
  } else if (method === "PUT") {
    Object.assign(group, demoInput<IGroupInput>(body), { id: group.id });
  } else if (method === "DELETE") {
    demoState.groups.groups = demoState.groups.groups.filter((item) => item.id !== group.id);
    demoState.groups.memberships = Object.fromEntries(
      Object.entries(demoState.groups.memberships).filter(([_user, id]) => id !== group.id),
    );
  }
  return demoState.groups;
}
