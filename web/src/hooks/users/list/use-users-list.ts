import { NETWORK } from "@/config/network";
import { useGroups } from "@/hooks/groups/hooks";
import { useUsers } from "@/hooks/users/user-queries";
import { GROUP_FILTERS, EMPTY_GROUPS } from "@/services/groups/types";
import { groupUsers, paginateGroups } from "@/services/groups/membership";
import { useState } from "react";
export function useUsersList() {
  const query = useUsers();
  const groups = useGroups(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [groupId, setGroupId] = useState<string>(GROUP_FILTERS.all);
  const filtered = (query.data ?? []).filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) &&
      (groupId === GROUP_FILTERS.all ||
        (groupId === GROUP_FILTERS.ungrouped
          ? !groups.data?.memberships?.[user.id]
          : groups.data?.memberships?.[user.id] === groupId)),
  );
  const pageCount = Math.ceil(filtered.length / NETWORK.pageSize);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const sections = paginateGroups(
    groupUsers(filtered, groups.data ?? EMPTY_GROUPS),
    current * NETWORK.pageSize,
    NETWORK.pageSize,
  );
  function onSearch(value: string) {
    setSearch(value);
    setPage(0);
  }
  function onGroup(value: string) {
    setGroupId(value);
    setPage(0);
  }
  return {
    query,
    groups,
    search,
    filtered,
    sections,
    pageCount,
    current,
    setPage,
    groupId,
    onSearch,
    onGroup,
  };
}
