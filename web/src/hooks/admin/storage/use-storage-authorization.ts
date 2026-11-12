import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storageApi, STORAGE_QUERY_KEY, type IStorageCallback } from "@/services/admin/storage";
import { useUiStore } from "@/store/ui-store";

function callback(value: unknown): value is IStorageCallback {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "hy2-cloud-authorization" &&
    "state" in value &&
    typeof value.state === "string" &&
    "code" in value &&
    typeof value.code === "string" &&
    "hasError" in value &&
    typeof value.hasError === "boolean"
  );
}
export function useStorageAuthorization(onComplete?: () => void) {
  const [isWaiting, setWaiting] = useState(false);
  const client = useQueryClient();
  const pending = useRef<{ state: string; origin: string; popup: Window | null } | null>(null);
  const handled = useRef("");
  const complete = useMutation({
    mutationFn: storageApi.complete,
    onSuccess: (accounts) => {
      client.setQueryData(STORAGE_QUERY_KEY, { accounts });
      useUiStore.getState().notify("Хранилище подключено");
      onComplete?.();
    },
    onSettled: () => setWaiting(false),
  });
  const completeRef = useRef(complete.mutate);
  completeRef.current = complete.mutate;
  useEffect(() => {
    function receive(payload: unknown) {
      if (!callback(payload) || handled.current === payload.state) return;
      handled.current = payload.state;
      setWaiting(false);
      if (payload.hasError) {
        useUiStore.getState().showError("Доступ к облаку не разрешён");
        return;
      }
      completeRef.current({ state: payload.state, code: payload.code });
    }
    function onMessage(event: MessageEvent<unknown>) {
      const flow = pending.current;
      if (
        !flow ||
        event.origin !== flow.origin ||
        event.source !== flow.popup ||
        !callback(event.data) ||
        event.data.state !== flow.state
      )
        return;
      receive(event.data);
    }
    const hash = window.location.hash;
    if (hash.startsWith("#cloudAuth=")) {
      useUiStore.getState().setSettingsSection("panel-backups", true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      try {
        receive(JSON.parse(decodeURIComponent(hash.slice("#cloudAuth=".length))));
      } catch {
        useUiStore.getState().showError("Не удалось завершить авторизацию");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useEffect(
    () => () => {
      pending.current?.popup?.close();
    },
    [],
  );
  return { pending, complete, isWaiting, setWaiting };
}
