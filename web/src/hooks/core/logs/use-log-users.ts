import { NETWORK } from "@/config/network";
import { type IUser } from "@/services/users/user-types";
import { useDeferredValue, useState } from "react";

export function useLogUsers(users: readonly IUser[]) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const query = useDeferredValue(search.trim().toLocaleLowerCase());
  const filtered = users.filter((user) =>
    (user.displayName ?? user.name).toLocaleLowerCase().includes(query),
  );
  const pageCount = Math.ceil(filtered.length / NETWORK.pageSize);
  const current = Math.min(page, Math.max(0, pageCount - 1));
  return {
    search,
    page: current,
    pageCount,
    setPage,
    visible: filtered.slice(current * NETWORK.pageSize, (current + 1) * NETWORK.pageSize),
    onSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
  };
}
