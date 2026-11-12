import { QUERY_KEYS } from "@/config/network";
import { announcementApi } from "@/services/admin/announcement";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useAnnouncement() {
  return useQuery({
    queryKey: QUERY_KEYS.announcement,
    queryFn: announcementApi.read,
  });
}
export function useSaveAnnouncement() {
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: announcementApi.save,
    onError: showError,
    onSuccess: (result) => {
      client.setQueryData(QUERY_KEYS.announcement, result);
      void client.invalidateQueries({ queryKey: QUERY_KEYS.users });
      notify("Настройки подписки сохранены. Обновите подписку в используемом приложении.");
    },
  });
}
