import { ShieldCheck } from "@/components/elements/icons";
import { UPDATE_LABELS, type IUpdateStatus } from "@/services/core/updates/update-types";
import { useTranslation } from "react-i18next";
export function UpdateProgress({ status }: { status: IUpdateStatus }) {
  const { t } = useTranslation();
  if (!status.busy) return null;
  return (
    <div
      className="update-progress flex items-center gap-3 p-3 border border-line bg-input"
      role="status"
      aria-live="polite"
    >
      <ShieldCheck width={24} height={24} aria-hidden />
      <div>
        <strong>{t(UPDATE_LABELS[status.result.phase])}</strong>
        <progress aria-label={t(UPDATE_LABELS[status.result.phase])} />
      </div>
    </div>
  );
}
