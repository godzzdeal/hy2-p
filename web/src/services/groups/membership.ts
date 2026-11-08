import { GROUP_FILTERS, type IGroup, type IGroups, type IGroupMembersChange } from "@/services/groups/types";
import { type IUser } from "@/services/users/user-types";

export interface IUserGroupSection {
  id: string;
  group?: IGroup;
  users: IUser[];
  total: number;
}

export function replaceGroupMembers(state: IGroups, change: IGroupMembersChange): IGroups {
  const memberships = Object.fromEntries(
    Object.entries(state.memberships).filter(([_user, group]) => group !== change.groupId),
  );
  for (const user of change.userIds) memberships[user] = change.groupId;
  return { ...state, memberships };
}

export function groupUsers(users: IUser[], state: IGroups): IUserGroupSection[] {
  const groups: IUserGroupSection[] = (state.groups ?? []).map((group) => ({
    id: group.id,
    group,
    users: [],
    total: 0,
  }));
  const ungrouped: IUserGroupSection = { id: GROUP_FILTERS.ungrouped, users: [], total: 0 };
  const lookup = new Map(groups.map((section) => [section.id, section]));
  for (const user of users) {
    const section = lookup.get(state.memberships?.[user.id]) ?? ungrouped;
    section.users.push(user);
    section.total++;
  }
  return [...groups, ungrouped].filter((section) => section.total > 0);
}

export function paginateGroups(
  sections: IUserGroupSection[],
  offset: number,
  limit: number,
): IUserGroupSection[] {
  const page: IUserGroupSection[] = [];
  let remaining = limit;
  let skip = offset;
  for (const section of sections) {
    if (remaining === 0) break;
    const users = section.users.slice(skip, skip + remaining);
    skip = Math.max(0, skip - section.users.length);
    if (users.length) {
      page.push({ ...section, users });
      remaining -= users.length;
    }
  }
  return page;
}
