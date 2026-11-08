import { useState } from "react";
import { NETWORK } from "@/shared/http";
import { useUsers } from "@/features/users/model";
import { useGroups, GROUP_FILTERS } from "@/features/groups";
export function useUsersList() {
  const query = useUsers();
  const groups = useGroups();
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
  const visible = filtered.slice(current * NETWORK.pageSize, (current + 1) * NETWORK.pageSize);
  function onSearch(value: string) {
    setSearch(value);
    setPage(0);
  }
  function onGroup(value: string) {
    setGroupId(value);
    setPage(0);
  }
  return { query, search, filtered, visible, pageCount, current, setPage, groupId, onSearch, onGroup };
}
