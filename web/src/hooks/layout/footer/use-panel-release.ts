import { QUERY_KEYS } from "@/config/network";
import { panelReleaseApi } from "@/services/panel/release";
import { useQuery } from "@tanstack/react-query";
const RELEASE_POLL_MS = 60 * 60 * 1000;
const RELEASE_STALE_MS = 5 * 60 * 1000;

const RELEASE_LABELS = {
  update_available: "Доступна версия {{version}}",
  current: "Установлена последняя версия",
  ahead: "Новее последнего релиза",
  unknown: "Последний релиз: {{version}}",
} as const;
export function usePanelRelease() {
  const query = useQuery({
    queryKey: QUERY_KEYS.panelRelease,
    queryFn: panelReleaseApi.read,
    staleTime: RELEASE_STALE_MS,
    refetchInterval: RELEASE_POLL_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const status = query.isFetching
    ? "Проверяем обновления…"
    : query.isError
      ? "Не удалось проверить обновления"
      : RELEASE_LABELS[query.data?.state ?? "unknown"];
  return {
    data: query.data,
    status,
    isFetching: query.isFetching,
    hasUpdate: !query.isError && query.data?.state === "update_available",
    onCheck: () => void query.refetch(),
  };
}
