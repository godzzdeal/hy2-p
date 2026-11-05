import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, ApiError } from "@/shared/http";
import { useUiStore } from "@/app/state";
import { sessionApi } from "./session-api";
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
      client.setQueryData(QUERY_KEYS.session, { ok: false });
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
      client.clear();
      client.setQueryData(QUERY_KEYS.session, { ok: false });
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
