import { useClearLogs } from "@/hooks/core/logs/use-clear-logs";
import { useCore } from "@/hooks/core/use-core";
import { useUsers } from "@/hooks/users/user-queries";
import { logEntries, LOG_VIEW, type TLogLevel } from "@/utils/core/logs";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { downloadFile } from "@/utils/files";
import { useUiStore } from "@/store/ui-store";

export function useLogEntries() {
  const query = useCore();
  const users = useUsers();
  const clear = useClearLogs();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<TLogLevel>("");
  const [userId, setUserId] = useState("");
  const text = query.data?.logs ?? "";
  const showError = useUiStore((state) => state.showError);
  const download = useMutation({
    mutationFn: () => downloadFile(new Blob([text], { type: "text/plain;charset=utf-8" }), "hysteria2.log"),
    onError: showError,
  });
  const lines = useMemo(
    () => logEntries(text, users.data ?? [], search, level, userId),
    [text, users.data, search, level, userId],
  );
  return {
    query,
    users,
    clear,
    download,
    search,
    setSearch,
    level,
    setLevel,
    userId,
    setUserId,
    text,
    visible: lines.slice(-LOG_VIEW.maxLines),
    total: lines.length,
  };
}
