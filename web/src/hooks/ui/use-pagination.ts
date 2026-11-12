import { NETWORK } from "@/config/network";
import { useState } from "react";

export function usePagination<T>(items: readonly T[], size = NETWORK.pageSize) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / size);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  return { items: items.slice(current * size, (current + 1) * size), current, pageCount, setPage };
}
