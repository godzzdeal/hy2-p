import { type IUserAccess } from "@/services/users/access/types";
export const GROUP_COLORS = ["cyan", "blue", "green", "amber", "purple", "gray"] as const;
export type TGroupColor = (typeof GROUP_COLORS)[number];
export interface IGroupInput {
  name: string;
  color: TGroupColor;
  access: IUserAccess;
  trafficLimit: number;
  deviceLimit: number;
}
export interface IGroup extends IGroupInput {
  id: string;
}
export interface IGroups {
  groups: IGroup[];
  memberships: Record<string, string>;
}
export interface IGroupSave {
  id?: string;
  body: IGroupInput;
}
export interface IGroupAssignment {
  userId: string;
  groupId: string;
}
export interface IGroupMembersChange {
  groupId: string;
  userIds: string[];
}
export const EMPTY_GROUPS: IGroups = { groups: [], memberships: {} };
export const GROUP_FILTERS = { all: "all", ungrouped: "ungrouped" } as const;
