import { useTranslation } from "react-i18next";
import { PlugZap } from "lucide-react";
import { useCore } from "@/features/core/model";
import { useUiStore } from "@/app/state";
import { useApplyPort } from "@/features/configuration/model/deployment/operation";
import { type IDeployment } from "@/features/configuration/model/deployment";
export function ApplyPortButton({ status }: { status: IDeployment }) {
  const { t } = useTranslation();
  const mutation = useApplyPort();
  const core = useCore();
  const isDirty = useUiStore((state) => state.hasUnsavedConfiguration);
  const canApply =
    core.data?.running === true && !isDirty && !status.agentBusy && !mutation.isPending && !status.udpWarning;
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
        <PlugZap size={16} aria-hidden />
        {t(mutation.isPending ? "Запускаем проверку…" : "Применить UDP-порт")}
      </button>
      <small className="mt-2 block">
        {t(
          "Панель кратковременно перезапустится. Результат проверки появится здесь; затем может потребоваться вход.",
        )}
      </small>
      {core.data && !core.data.running && <p className="mt-2">{t("Для проверки сначала запустите ядро.")}</p>}
      {isDirty && <p className="mt-2">{t("Сначала сохраните изменения конфигурации.")}</p>}
    </div>
  );
}
