import { transferApi, TRANSFER_LIMIT } from "@/services/admin/transfer/api";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
export function useTransfer() {
  const [bundle, setBundle] = useState<unknown>(null);
  const client = useQueryClient();
  const { notify, showError } = useUiStore();
  const preview = useMutation({ mutationFn: transferApi.preview, onError: showError });
  const apply = useMutation({
    mutationFn: () => transferApi.apply(bundle, preview.data?.fingerprint ?? ""),
    onSuccess: (result) => {
      void client.invalidateQueries();
      if (result.rows.some((row) => row.action === "failed"))
        showError("Импорт завершён с ошибками. Проверьте результат переноса.");
      else notify("Импорт завершён. Существующие записи не изменены.");
    },
    onError: showError,
  });
  const read = useMutation({
    mutationFn: async (file: File) => {
      setBundle(null);
      preview.reset();
      apply.reset();
      if (file.size > TRANSFER_LIMIT) throw new Error("Размер файла не должен превышать 16 МБ");
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("Не удалось прочитать JSON-файл HY2-P");
      }
      setBundle(parsed);
      return preview.mutateAsync(parsed);
    },
    onError: showError,
  });
  const download = useMutation({
    mutationFn: async () => {
      const data = await transferApi.export();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "hy2-p.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onSuccess: () => notify("Файл экспорта подготовлен."),
    onError: showError,
  });
  function onBind(source: string, target: string) {
    if (typeof bundle !== "object" || bundle === null || Array.isArray(bundle)) return;
    const previous =
      "targets" in bundle && typeof bundle.targets === "object" && bundle.targets !== null
        ? bundle.targets
        : {};
    const targets: Record<string, unknown> = { ...previous, [source]: target };
    if (!target) delete targets[source];
    const next = { ...bundle, targets };
    setBundle(next);
    apply.reset();
    preview.mutate(next);
  }
  return {
    preview: apply.data ?? preview.data,
    hasApplied: apply.isSuccess,
    onBind,
    onRefresh: () => {
      apply.reset();
      preview.mutate(bundle);
    },
    isBusy: read.isPending || preview.isPending || apply.isPending || download.isPending,
    onRead: (file: File) => read.mutate(file),
    onApply: () => apply.mutate(),
    onExport: () => download.mutate(),
  };
}
