import { NETWORK } from "@/config/network";
import { useGroups } from "@/hooks/groups/hooks";
import { useUsers } from "@/hooks/users/user-queries";
import { useState } from "react";

export function useMemberSelection(groupId: string) {
  const groups = useGroups();
  const users = useUsers();
  const [selection, setSelection] = useState<string[]>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const selected =
    selection ??
    users.data?.filter((user) => groups.data?.memberships?.[user.id] === groupId).map((user) => user.id) ??
    [];
  const selectedIds = new Set(selected);
  const filtered = (users.data ?? []).filter((user) =>
    user.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const pageCount = Math.ceil(filtered.length / NETWORK.pageSize);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const visible = filtered.slice(current * NETWORK.pageSize, (current + 1) * NETWORK.pageSize);
  const isFoundSelected = filtered.length > 0 && filtered.every((user) => selectedIds.has(user.id));
  function onToggle(userId: string, isChecked: boolean) {
    setSelection(
      isChecked
        ? [...selected.filter((id) => id !== userId), userId]
        : selected.filter((id) => id !== userId),
    );
  }
  function onFound() {
    const found = new Set(filtered.map((user) => user.id));
    setSelection(
      isFoundSelected ? selected.filter((id) => !found.has(id)) : [...new Set([...selected, ...found])],
    );
  }
  function onSearch(value: string) {
    setSearch(value);
    setPage(0);
  }
  return {
    groups,
    users,
    selected,
    selectedIds,
    search,
    onSearch,
    current,
    pageCount,
    setPage,
    visible,
    isFoundSelected,
    onFound,
    onToggle,
    found: filtered.length,
  };
}
