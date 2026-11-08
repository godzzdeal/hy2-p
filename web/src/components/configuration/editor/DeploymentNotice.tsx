import { ApplyPortButton } from "@/components/configuration/ports/ApplyPortButton";
import { Copy } from "@/components/elements/icons";
import { useDeployment } from "@/hooks/configuration/deployment/use-deployment";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
export function DeploymentNotice() {
  const { t } = useTranslation();
  const query = useDeployment();
  const { notify, showError } = useUiStore();
  const status = query.data;
  const command = "sudo hy2-panel restart";
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      notify("Скопировано");
    } catch {
      showError(new Error(t("Скопируйте команду вручную.")));
    }
  }
  if (query.error)
    return (
      <p className="config-note" role="alert">
        {t("Не удалось проверить UDP-порты Docker.")}
      </p>
    );
  if (!status?.container) return null;
  return (
    <div className="config-note" role="status">
      <p>
        {status.publishedUdpPort
          ? t("Сейчас Docker принимает UDP {{public}} и передаёт его ядру на порт {{target}}.", {
              public: status.publishedUdpPort,
              target: status.publishedUdpListenPort,
            })
          : t("UDP-порт этого ядра ещё не опубликован. Запустите ядро и нажмите «Применить UDP-порт».")}
      </p>
      {status.udpWarning && <p className="mt-2">{t(status.udpWarning)}</p>}
      {status.udpRestartRequired && (
        <div className="mt-2">
          <p>
            {t("Сохранённые порты: снаружи {{public}}, в контейнере {{target}}.", {
              public: status.udpPublicPort,
              target: status.udpListenPort,
            })}
          </p>
          {status.agentAvailable ? (
            <ApplyPortButton status={status} />
          ) : (
            <div>
              <p>{t("Помощник автоприменения не установлен. Обновите панель новым установщиком.")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code>{command}</code>
                <button type="button" className="text-btn" onClick={() => void onCopy()}>
                  <Copy width={24} height={24} aria-hidden />
                  {t("Скопировать команду")}
                </button>
              </div>
            </div>
          )}
          <small>{t("Публичный UDP-порт должен быть разрешён в сетевом экране сервера и хостинга.")}</small>
        </div>
      )}
    </div>
  );
}
