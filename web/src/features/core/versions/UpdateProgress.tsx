import { useTranslation } from "react-i18next";
import { Check, ShieldCheck, TriangleAlert } from "@/shared/icons";
import { type IUpdateStatus } from "@/features/core/model/updates";
import { UPDATE_LABELS } from "@/features/core/model/updates";
import { cn } from "@/shared/lib";
export function UpdateProgress({ status }: { status: IUpdateStatus }) {
  const { t } = useTranslation();
  const hasFailed = status.result.phase === "failed" || status.result.phase === "rolled_back";
  const Icon = hasFailed ? TriangleAlert : status.busy ? ShieldCheck : Check;
  return (
    <div
      className={cn("update-progress", {
        "update-progress-warning": hasFailed,
      })}
      role="status"
      aria-live="polite"
    >
      <Icon width={24} height={24} aria-hidden />
      <div>
        <strong>{t(UPDATE_LABELS[status.result.phase])}</strong>
        <p>{status.result.message || t("Скачивание и проверка выполняются до остановки текущего ядра.")}</p>
        {status.busy && <progress aria-label={t(UPDATE_LABELS[status.result.phase])} />}
      </div>
    </div>
  );
}
