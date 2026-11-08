import { request, API_ROUTES } from "@/shared/http";
import { type IGroups, type IGroupSave, type IGroupAssignment } from "./types";
export const groupsApi = {
  list: (): Promise<IGroups> => request(API_ROUTES.groups),
  save: ({ id, body }: IGroupSave): Promise<IGroups> =>
    request(id ? API_ROUTES.group(id) : API_ROUTES.groups, { method: id ? "PUT" : "POST", body }),
  remove: (id: string): Promise<IGroups> => request(API_ROUTES.group(id), { method: "DELETE" }),
  assign: ({ userId, groupId }: IGroupAssignment): Promise<IGroups> =>
    request(API_ROUTES.userGroup(userId), { method: "PUT", body: { groupId } }),
};
