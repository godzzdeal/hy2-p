import { QUERY_KEYS } from "@/config/network";
import { endSession } from "@/hooks/session/end-session";
import { adminApi } from "@/services/admin/admin-api";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useAccount() {
  return useQuery({
    queryKey: QUERY_KEYS.adminAccount,
    queryFn: adminApi.account,
  });
}
export function useWebSettings() {
  return useQuery({ queryKey: QUERY_KEYS.adminWeb, queryFn: adminApi.web });
}
export function useAccountChange() {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: adminApi.changeAccount,
    onError: showError,
    onSuccess: (result) => {
      localStorage.setItem("hy2.login", result.username);
      endSession(client);
      notify("Данные входа изменены. Войдите заново.");
    },
  });
}
export function useSaveWeb() {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: adminApi.saveWeb,
    onError: showError,
    onSuccess: (result) => {
      client.setQueryData(QUERY_KEYS.adminWeb, result);
      notify("Настройки сети сохранены. Для применения перезапустите панель.");
    },
  });
}
