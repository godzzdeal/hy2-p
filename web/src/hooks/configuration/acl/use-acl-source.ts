import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aclFilesApi, ACL_FILE_LIMITS, type TAclFileKind } from "@/services/configuration/tools";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";

export const ACL_SOURCE_MODES = ["path", "upload", "url"] as const;
export type TAclSourceMode = (typeof ACL_SOURCE_MODES)[number];
export const ACL_SOURCE_LABELS = {
  path: "Путь на сервере",
  upload: "Загрузить файл",
  url: "Скачать по ссылке",
} as const;

export function useAclSource(kind: TAclFileKind, onSet: (path: string, value: unknown) => void) {
  const id = useInstanceId();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  const [mode, setMode] = useState<TAclSourceMode>("path");
  const [url, setUrl] = useState("");
  const upload = useMutation({
    mutationFn: aclFilesApi.store,
    onSuccess: (result, variables) => {
      if (variables.id !== id) return;
      onSet("acl." + kind, result.path);
      notify("Файл готов. Сохраните конфигурацию.");
    },
  });
  async function onFile(file: File) {
    if (file.size > ACL_FILE_LIMITS[kind]) throw new Error("Файл превышает допустимый размер");
    await upload.mutateAsync({ kind, source: file, id });
  }
  return {
    mode,
    setMode,
    url,
    setUrl,
    isPending: upload.isPending,
    onFile,
    onDownload: () => upload.mutate({ kind, source: url.trim(), id }, { onError: showError }),
  };
}
