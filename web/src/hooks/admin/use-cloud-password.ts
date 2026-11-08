import { QUERY_KEYS } from "@/config/network";
import { endSession } from "@/hooks/session/end-session";
import { cloudPasswordApi } from "@/services/session/cloud-password";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCloudPassword() {
  return useQuery({ queryKey: QUERY_KEYS.cloudPassword, queryFn: cloudPasswordApi.read });
}
export function useSaveCloudPassword() {
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  return useMutation({
    mutationFn: cloudPasswordApi.save,
    gcTime: 0,
    onError: showError,
    onSuccess: () => {
      endSession(client);
      notify("Настройки облачного пароля сохранены. Войдите заново.");
    },
  });
}
