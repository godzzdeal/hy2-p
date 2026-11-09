import { PlugZap } from "@/components/elements/icons";
import { useApplyPort } from "@/hooks/configuration/deployment/operation/hooks";
import { type IDeployment } from "@/services/configuration/deployment/deployment-api";
import { useUiStore } from "@/store/ui-store";
import { usePortOperationStore } from "@/store/core/port-operation-store";
import { useTranslation } from "react-i18next";
export function ApplyPortButton({ status }: { status: IDeployment }) {
  const { t } = useTranslation();
  const mutation = useApplyPort();
  const isDirty = useUiStore((state) => state.hasUnsavedConfiguration);
  const ticket = usePortOperationStore((state) => state.ticket);
  const canApply = !ticket && !isDirty && !status.agentBusy && !mutation.isPending && !status.udpWarning;
  return (
    <div className="mt-3">
      <button
        type="button"
        className="primary"
        disabled={!canApply}
        onClick={() =>
          mutation.mutate({ publicPort: status.udpPublicPort, listenPort: status.udpListenPort })
        }
      >
        <PlugZap width={24} height={24} aria-hidden />
        {t(mutation.isPending ? "Запускаем проверку…" : "Применить UDP-порт")}
      </button>
      <small className="mt-2 block">
        {t(
          "Панель кратковременно перезапустится. Результат проверки появится здесь; затем может потребоваться вход.",
        )}
      </small>
      {isDirty && <p className="mt-2">{t("Сначала сохраните изменения конфигурации.")}</p>}
    </div>
  );
}
