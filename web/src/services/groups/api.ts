import { API_ROUTES } from "@/config/network";
import { type IGroupAssignment, type IGroups, type IGroupSave } from "@/services/groups/types";
import { request } from "@/services/http/client";
export const groupsApi = {
  list: (): Promise<IGroups> => request(API_ROUTES.groups),
  save: ({ id, body }: IGroupSave): Promise<IGroups> =>
    request(id ? API_ROUTES.group(id) : API_ROUTES.groups, { method: id ? "PUT" : "POST", body }),
  remove: (id: string): Promise<IGroups> => request(API_ROUTES.group(id), { method: "DELETE" }),
  assign: ({ userId, groupId }: IGroupAssignment): Promise<IGroups> =>
    request(API_ROUTES.userGroup(userId), { method: "PUT", body: { groupId } }),
};
