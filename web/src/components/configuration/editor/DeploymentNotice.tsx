import { Notice } from "@/components/ui/feedback";
import { ApplyPortButton } from "@/components/configuration/ports/ApplyPortButton";
import { CommandBlock } from "@/components/elements/copy";
import { useDeployment } from "@/hooks/configuration/deployment/use-deployment";
import { useTranslation } from "react-i18next";
export function DeploymentNotice() {
  const { t } = useTranslation();
  const query = useDeployment();
  const status = query.data;
  if (query.error)
    return (
      <Notice variant="danger" role="alert" className="mx-4 mt-4 mb-0">
        {t("Не удалось проверить UDP-порты Docker.")}
      </Notice>
    );
  if (!status?.container) return null;
  return (
    <Notice
      role="status"
      variant={
        status.udpWarning || status.udpRestartRequired || !status.publishedUdpPort ? "warning" : "info"
      }
      className="mx-4 mt-4 mb-0"
    >
      <p>
        {status.publishedUdpPort
          ? t("Сейчас Docker принимает UDP {{public}} и передаёт его экземпляру на порт {{target}}.", {
              public: status.publishedUdpPort,
              target: status.publishedUdpListenPort,
            })
          : t("UDP-порт не опубликован. Примените его в конфигурации экземпляра.")}
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
              <CommandBlock command="sudo hy2-panel restart" />
            </div>
          )}
          <small>{t("Публичный UDP-порт должен быть разрешён в сетевом экране сервера и хостинга.")}</small>
        </div>
      )}
    </Notice>
  );
}
