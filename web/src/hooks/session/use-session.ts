import { QUERY_KEYS } from "@/config/network";
import { endSession } from "@/hooks/session/end-session";
import { ApiError } from "@/services/http/ApiError";
import { sessionApi } from "@/services/session/session-api";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
export function useSession() {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: sessionApi.read,
    retry: false,
  });
  const showError = useUiStore((state) => state.showError);
  useEffect(() => {
    const onExpired = () => {
      endSession(client);
    };
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, [client]);
  const login = useMutation({
    mutationFn: sessionApi.login,
    onSuccess: (data) => {
      client.setQueryData(QUERY_KEYS.session, data);
    },
    onError: showError,
  });
  const logout = useMutation({
    mutationFn: sessionApi.logout,
    onSuccess: () => {
      endSession(client);
    },
    onError: showError,
  });
  return {
    isLoading: session.isPending,
    isAuthorized: session.data?.ok === true,
    error: session.error instanceof ApiError && session.error.status === 401 ? null : session.error,
    login,
    logout,
  };
}
