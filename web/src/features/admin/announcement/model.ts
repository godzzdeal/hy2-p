import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, API_ROUTES, QUERY_KEYS } from "@/shared/http";
import { useUiStore } from "@/app/state";
export interface IAnnouncement {
  profileTitle?: string;
  enabled: boolean;
  text: string;
  updateInterval: number;
}
export const ANNOUNCEMENT_LIMIT = 200;
export const MAX_UPDATE_HOURS = 168;
export function useAnnouncement() {
  return useQuery({
    queryKey: QUERY_KEYS.announcement,
    queryFn: () => request<IAnnouncement>(API_ROUTES.announcement),
  });
}
export function useSaveAnnouncement() {
  const client = useQueryClient();
  const { showError, notify } = useUiStore();
  return useMutation({
    mutationFn: (body: IAnnouncement) =>
      request<IAnnouncement>(API_ROUTES.announcement, { method: "PUT", body }),
    onError: showError,
    onSuccess: (result) => {
      client.setQueryData(QUERY_KEYS.announcement, result);
      notify("Настройки подписки сохранены. Обновите подписку в Happ.");
    },
  });
}
