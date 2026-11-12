import { LoaderCircle } from "@/components/elements/icons";
import { usePortProgress } from "@/hooks/configuration/deployment/operation/hooks";
import { usePortOperationStore } from "@/store/core/port-operation-store";
import { useUiStore } from "@/store/ui-store";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
export function ApplyPortProgress() {
  const { t } = useTranslation();
  const query = usePortProgress();
  const clear = usePortOperationStore((state) => state.setTicket);
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  const result = query.data;
  useEffect(() => {
    if (!query.ticket) return;
    if (query.isMissing) {
      showError(query.error);
      clear("");
      return;
    }
    if (!result || result.busy || result.phase === "idle") return;
    if (result.phase === "success") notify(result.message);
    else showError(result.message);
    clear("");
  }, [result, query.ticket, query.isMissing, query.error, notify, showError, clear]);
  if (!query.ticket) return null;
  return (
    <aside
      className="port-operation fixed p-4 border border-line rounded-none bg-surface text-foreground shadow-popup z-20 text-xl max-tablet:bottom-16 flex gap-3 items-center"
      role="status"
    >
      <LoaderCircle width={24} height={24} aria-hidden />
      <span>
        {t(
          query.error
            ? "Восстанавливаем связь с панелью. Проверка продолжается."
            : "Применяем и проверяем UDP-порт",
        )}
      </span>
    </aside>
  );
}
