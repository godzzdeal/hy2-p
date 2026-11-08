import { QUERY_KEYS } from "@/config/network";
import { sessionApi } from "@/services/session/session-api";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCloudLogin() {
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: sessionApi.cloudLogin,
    gcTime: 0,
    onSuccess: (session) => client.setQueryData(QUERY_KEYS.session, session),
    onError: showError,
  });
}
